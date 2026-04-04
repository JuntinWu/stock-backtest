const { fetchHistory } = require('./_lib/yahoo');
const { computeLohas } = require('./_lib/lohas');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    const history = await fetchHistory(ticker, period1, period2);

    if (!history || history.length < 10) {
      return res.status(404).json({
        error: `找不到 "${ticker}" 的歷史資料。台股請加 .TW（如 0050.TW），美股直接輸入代號（如 VOO）。`,
      });
    }

    history.sort((a, b) => a.date - b.date);

    const result = computeLohas(history, sigmaMult);

    res.json({
      ticker: ticker.trim().toUpperCase(),
      period: periodYears,
      sigmaMult,
      ...result,
    });
  } catch (err) {
    console.error(err);
    const msg = err.message || '未知錯誤';
    res.status(500).json({ error: `分析失敗：${msg}` });
  }
};
