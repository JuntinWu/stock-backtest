const express = require('express');
const cors = require('cors');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── XIRR (Newton-Raphson) ────────────────────────────────────────────────────
function xirr(cashflows) {
  if (!cashflows || cashflows.length < 2) return NaN;

  const t0 = cashflows[0].date.getTime();
  const YEAR_MS = 365.25 * 24 * 3600 * 1000;

  const npv = (r) =>
    cashflows.reduce((sum, cf) => {
      const t = (cf.date.getTime() - t0) / YEAR_MS;
      return sum + cf.amount / Math.pow(1 + r, t);
    }, 0);

  const dnpv = (r) =>
    cashflows.reduce((sum, cf) => {
      const t = (cf.date.getTime() - t0) / YEAR_MS;
      return sum - (t * cf.amount) / Math.pow(1 + r, t + 1);
    }, 0);

  let rate = 0.1;
  for (let i = 0; i < 2000; i++) {
    const f = npv(rate);
    const df = dnpv(rate);
    if (Math.abs(df) < 1e-14) break;
    const next = rate - f / df;
    if (Math.abs(next - rate) < 1e-9) return next;
    rate = next;
    if (rate <= -1) rate = -0.5 + Math.random() * 0.1;
  }
  return rate;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function groupByYearMonth(history) {
  const map = {};
  for (const row of history) {
    const y = row.date.getFullYear();
    const m = row.date.getMonth() + 1;
    const key = `${y}-${String(m).padStart(2, '0')}`;
    if (!map[key]) map[key] = { first: row, last: row };
    else {
      if (row.date < map[key].first.date) map[key].first = row;
      if (row.date > map[key].last.date) map[key].last = row;
    }
  }
  return map;
}

function groupByYear(history) {
  const map = {};
  for (const row of history) {
    const y = row.date.getFullYear();
    if (!map[y]) map[y] = [];
    map[y].push(row);
  }
  return map;
}

function getPrice(row) {
  return row.adjClose || row.close;
}

// ─── Strategy Builders ────────────────────────────────────────────────────────
function buildDCABuys(byYearMonth, monthly) {
  return Object.entries(byYearMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, { first }]) => {
      const price = getPrice(first);
      return { date: first.date, price, shares: monthly / price, amount: monthly };
    });
}

function buildYearlyBuys(byYear, yearly, type) {
  return Object.entries(byYear)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, rows]) => {
      const best = rows.reduce((acc, r) => {
        const p = getPrice(r);
        const ap = getPrice(acc);
        return type === 'low' ? (p < ap ? r : acc) : (p > ap ? r : acc);
      }, rows[0]);
      const price = getPrice(best);
      return { date: best.date, price, shares: yearly / price, amount: yearly };
    });
}

function computeStrategy(buys, lastPrice, lastDate, label) {
  if (!buys.length) return null;
  const totalShares = buys.reduce((s, b) => s + b.shares, 0);
  const totalInvested = buys.reduce((s, b) => s + b.amount, 0);
  const finalValue = totalShares * lastPrice;

  const cashflows = buys.map((b) => ({ amount: -b.amount, date: b.date }));
  cashflows.push({ amount: finalValue, date: lastDate });

  const irr = xirr(cashflows);
  return {
    label,
    totalInvested: Math.round(totalInvested),
    finalValue: Math.round(finalValue),
    totalReturn: Math.round(finalValue - totalInvested),
    totalReturnPct: ((finalValue - totalInvested) / totalInvested) * 100,
    irr,
    shares: totalShares,
  };
}

function buildChartData(dcaBuys, luckyBuys, unluckyBuys, lumpsumBuys, byYearMonth) {
  const sortedMonths = Object.entries(byYearMonth).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const streams = {
    dca: [...dcaBuys],
    lucky: [...luckyBuys],
    unlucky: [...unluckyBuys],
    lumpsum: [...lumpsumBuys],
  };
  const idx = { dca: 0, lucky: 0, unlucky: 0, lumpsum: 0 };
  const shares = { dca: 0, lucky: 0, unlucky: 0, lumpsum: 0 };
  const invested = { dca: 0, lucky: 0, unlucky: 0, lumpsum: 0 };

  const data = [];
  for (const [monthKey, { last }] of sortedMonths) {
    const endDate = last.date;
    const price = getPrice(last);

    for (const k of ['dca', 'lucky', 'unlucky', 'lumpsum']) {
      const buys = streams[k];
      while (idx[k] < buys.length && buys[idx[k]].date <= endDate) {
        shares[k] += buys[idx[k]].shares;
        invested[k] += buys[idx[k]].amount;
        idx[k]++;
      }
    }

    data.push({
      date: monthKey,
      dca: Math.round(shares.dca * price),
      lucky: Math.round(shares.lucky * price),
      unlucky: Math.round(shares.unlucky * price),
      lumpsum: Math.round(shares.lumpsum * price),
      invested: Math.round(invested.dca),
    });
  }
  return data;
}

// ─── Retry helper for rate limiting ─────────────────────────────────────────
async function fetchWithRetry(fn, maxRetries = 3, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err.message?.includes('Too Many Requests') ||
                     err.message?.includes('429') ||
                     err.statusCode === 429;
      if (is429 && attempt < maxRetries) {
        const wait = delayMs * attempt;
        console.log(`⏳ Rate limited, retrying in ${wait}ms (attempt ${attempt}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, wait));
      } else {
        throw err;
      }
    }
  }
}

// ─── API Route ───────────────────────────────────────────────────────────────
app.get('/api/backtest', async (req, res) => {
  const { ticker, monthlyAmount, startYear, endYear } = req.query;

  if (!ticker || !monthlyAmount || !startYear || !endYear) {
    return res.status(400).json({
      error: '缺少必要參數：ticker, monthlyAmount, startYear, endYear',
    });
  }

  const monthly = parseFloat(monthlyAmount);
  const yearly = monthly * 12;
  const sy = parseInt(startYear, 10);
  const ey = parseInt(endYear, 10);

  if (isNaN(monthly) || monthly <= 0) {
    return res.status(400).json({ error: '投資金額必須為正數' });
  }
  if (sy >= ey) {
    return res.status(400).json({ error: '開始年份必須小於結束年份' });
  }

  try {
    const result = await fetchWithRetry(() =>
      yahooFinance.chart(ticker.trim(), {
        period1: new Date(`${sy}-01-01`),
        period2: new Date(`${ey}-12-31`),
        interval: '1d',
      })
    );

    // chart() returns { quotes: [...] }
    const history = (result.quotes || [])
      .filter((q) => q.close != null || q.adjclose != null)
      .map((q) => ({
        date: new Date(q.date),
        close: q.close,
        adjClose: q.adjclose ?? q.close,
      }));

    if (!history || history.length < 10) {
      return res.status(404).json({
        error: `找不到 "${ticker}" 的歷史資料。台股請加 .TW（如 0050.TW），美股直接輸入代號（如 VOO）。`,
      });
    }

    history.sort((a, b) => a.date - b.date);

    const byYearMonth = groupByYearMonth(history);
    const byYear = groupByYear(history);
    const lastRow = history[history.length - 1];
    const lastPrice = getPrice(lastRow);
    const lastDate = lastRow.date;

    const dcaBuys = buildDCABuys(byYearMonth, monthly);
    const luckyBuys = buildYearlyBuys(byYear, yearly, 'low');
    const unluckyBuys = buildYearlyBuys(byYear, yearly, 'high');

    // Lumpsum: total amount invested at the very first trading day
    const totalAmount = monthly * Object.keys(byYearMonth).length;
    const firstRow = history[0];
    const firstPrice = getPrice(firstRow);
    const lumpsumBuys = [{ date: firstRow.date, price: firstPrice, shares: totalAmount / firstPrice, amount: totalAmount }];

    const strategies = {
      lumpsum: computeStrategy(lumpsumBuys, lastPrice, lastDate, `單筆投入（第一天 All-in）`),
      dca: computeStrategy(dcaBuys, lastPrice, lastDate, `不擇時每月定額 DCA`),
      lucky: computeStrategy(luckyBuys, lastPrice, lastDate, `天選之人（年度最低點）`),
      unlucky: computeStrategy(unluckyBuys, lastPrice, lastDate, `地獄倒霉鬼（年度最高點）`),
    };

    const chartData = buildChartData(dcaBuys, luckyBuys, unluckyBuys, lumpsumBuys, byYearMonth);

    // Sample to max 120 points for performance
    const sampled =
      chartData.length > 120
        ? chartData.filter((_, i) => i % Math.ceil(chartData.length / 120) === 0)
        : chartData;

    res.json({
      strategies,
      chartData: sampled,
      metadata: {
        ticker: ticker.trim().toUpperCase(),
        startDate: history[0].date.toISOString().split('T')[0],
        endDate: lastDate.toISOString().split('T')[0],
        totalMonths: Object.keys(byYearMonth).length,
        totalYears: Object.keys(byYear).length,
      },
    });
  } catch (err) {
    console.error(err);
    const msg = err.message || '未知錯誤';
    res.status(500).json({ error: `資料獲取失敗：${msg}` });
  }
});

// ─── Price Lookup API ────────────────────────────────────────────────────────
app.get('/api/prices', async (req, res) => {
  const { ticker, startDate, endDate } = req.query;

  if (!ticker || !startDate || !endDate) {
    return res.status(400).json({
      error: '缺少必要參數：ticker, startDate, endDate',
    });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: '日期格式無效' });
  }
  if (start >= end) {
    return res.status(400).json({ error: '開始日期必須早於結束日期' });
  }

  try {
    const result = await fetchWithRetry(() =>
      yahooFinance.chart(ticker.trim(), {
        period1: start,
        period2: end,
        interval: '1d',
      })
    );

    const quotes = (result.quotes || [])
      .filter((q) => q.close != null || q.adjclose != null)
      .map((q) => ({
        date: new Date(q.date).toISOString().split('T')[0],
        open: q.open != null ? +q.open.toFixed(2) : null,
        high: q.high != null ? +q.high.toFixed(2) : null,
        low: q.low != null ? +q.low.toFixed(2) : null,
        close: q.close != null ? +q.close.toFixed(2) : null,
        adjClose: q.adjclose != null ? +q.adjclose.toFixed(2) : (q.close != null ? +q.close.toFixed(2) : null),
        volume: q.volume ?? null,
      }));

    if (!quotes.length) {
      return res.status(404).json({
        error: `找不到 "${ticker}" 在此區間的歷史資料。`,
      });
    }

    res.json({
      ticker: ticker.trim().toUpperCase(),
      count: quotes.length,
      quotes,
    });
  } catch (err) {
    console.error(err);
    const msg = err.message || '未知錯誤';
    res.status(500).json({ error: `資料獲取失敗：${msg}` });
  }
});

// ─── LOHAS Five Lines API ──────────────────────────────────────────────────
const { calculate: calculateDividend } = require('../api/_lib/etf-dividend');

app.post('/api/etf-dividend', (req, res) => {
  const { targetMonthly, etfs } = req.body;

  if (!targetMonthly || targetMonthly <= 0) {
    return res.status(400).json({ error: '目標月被動收入必須為正數' });
  }

  if (!Array.isArray(etfs) || etfs.length === 0) {
    return res.status(400).json({ error: '至少需要一支 ETF' });
  }

  for (const etf of etfs) {
    if (!etf.ticker || !etf.name || etf.price <= 0 || etf.annualDividend <= 0) {
      return res.status(400).json({ error: `ETF "${etf.ticker || '?'}" 資料不完整` });
    }
  }

  const result = calculateDividend(targetMonthly, etfs);
  res.json(result);
});

const { computeLohas } = require('../api/_lib/lohas');

app.get('/api/lohas', async (req, res) => {
  const { ticker, period, sigma } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: '缺少必要參數：ticker' });
  }

  const periodYears = parseInt(period, 10) || 5;
  if (![3, 5, 10].includes(periodYears)) {
    return res.status(400).json({ error: '期間僅支援 3、5、10 年' });
  }

  const sigmaMult = parseFloat(sigma) || 2;
  if (sigmaMult < 0.5 || sigmaMult > 3) {
    return res.status(400).json({ error: '標準差倍數須介於 0.5 ~ 3' });
  }

  try {
    const now = new Date();
    const period1 = new Date(now.getFullYear() - periodYears, now.getMonth(), now.getDate());
    const period2 = now;

    const result = await fetchWithRetry(() =>
      yahooFinance.chart(ticker.trim(), {
        period1,
        period2,
        interval: '1d',
      })
    );

    const history = (result.quotes || [])
      .filter((q) => q.close != null || q.adjclose != null)
      .map((q) => ({
        date: new Date(q.date),
        close: q.close,
        adjClose: q.adjclose ?? q.close,
      }));

    if (!history || history.length < 10) {
      return res.status(404).json({
        error: `找不到 "${ticker}" 的歷史資料。台股請加 .TW（如 0050.TW），美股直接輸入代號（如 VOO）。`,
      });
    }

    history.sort((a, b) => a.date - b.date);

    const lohasResult = computeLohas(history, sigmaMult);

    res.json({
      ticker: ticker.trim().toUpperCase(),
      period: periodYears,
      sigmaMult,
      ...lohasResult,
    });
  } catch (err) {
    console.error(err);
    const msg = err.message || '未知錯誤';
    res.status(500).json({ error: `分析失敗：${msg}` });
  }
});

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
