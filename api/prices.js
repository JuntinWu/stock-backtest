const { fetchHistory } = require('./_lib/yahoo');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    const history = await fetchHistory(ticker, start, end);

    const quotes = history.map((q) => ({
      date: q.date.toISOString().split('T')[0],
      open: q.open != null ? +q.open.toFixed(2) : null,
      high: q.high != null ? +q.high.toFixed(2) : null,
      low: q.low != null ? +q.low.toFixed(2) : null,
      close: q.close != null ? +q.close.toFixed(2) : null,
      adjClose: q.adjClose != null ? +q.adjClose.toFixed(2) : (q.close != null ? +q.close.toFixed(2) : null),
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
};
