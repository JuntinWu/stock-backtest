const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

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

function buildChartData(dcaBuys, luckyBuys, unluckyBuys, byYearMonth) {
  const sortedMonths = Object.entries(byYearMonth).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const streams = {
    dca: [...dcaBuys],
    lucky: [...luckyBuys],
    unlucky: [...unluckyBuys],
  };
  const idx = { dca: 0, lucky: 0, unlucky: 0 };
  const shares = { dca: 0, lucky: 0, unlucky: 0 };
  const invested = { dca: 0, lucky: 0, unlucky: 0 };

  const data = [];
  for (const [monthKey, { last }] of sortedMonths) {
    const endDate = last.date;
    const price = getPrice(last);

    for (const k of ['dca', 'lucky', 'unlucky']) {
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
        console.log(`Rate limited, retrying in ${wait}ms (attempt ${attempt}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, wait));
      } else {
        throw err;
      }
    }
  }
}

// ─── Fetch history ──────────────────────────────────────────────────────────
async function fetchHistory(ticker, period1, period2) {
  const result = await fetchWithRetry(() =>
    yahooFinance.chart(ticker.trim(), {
      period1,
      period2,
      interval: '1d',
    })
  );

  return (result.quotes || [])
    .filter((q) => q.close != null || q.adjclose != null)
    .map((q) => ({
      date: new Date(q.date),
      close: q.close,
      adjClose: q.adjclose ?? q.close,
      open: q.open,
      high: q.high,
      low: q.low,
      volume: q.volume,
    }));
}

module.exports = {
  fetchHistory,
  getPrice,
  groupByYearMonth,
  groupByYear,
  buildDCABuys,
  buildYearlyBuys,
  computeStrategy,
  buildChartData,
};
