const {
  fetchHistory,
  getPrice,
  groupByYearMonth,
  groupByYear,
  buildDCABuys,
  buildYearlyBuys,
  computeStrategy,
  buildChartData,
} = require('./_lib/yahoo');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    const history = await fetchHistory(ticker, new Date(`${sy}-01-01`), new Date(`${ey}-12-31`));

    if (!history || history.length < 10) {
      return res.status(404).json({
        error: `找不到 "${ticker}" 的歷史資料。台股請加 .TW（如 0050.TW），美股直接輸入代號（如 SPY）。`,
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

    const strategies = {
      dca: computeStrategy(dcaBuys, lastPrice, lastDate, '不擇時每月定額 DCA'),
      lucky: computeStrategy(luckyBuys, lastPrice, lastDate, '天選之人（年度最低點）'),
      unlucky: computeStrategy(unluckyBuys, lastPrice, lastDate, '地獄倒霉鬼（年度最高點）'),
    };

    const chartData = buildChartData(dcaBuys, luckyBuys, unluckyBuys, byYearMonth);

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
};
