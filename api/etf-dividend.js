const { calculateAll } = require('./_lib/etf-dividend');

module.exports = function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

  const result = calculateAll(targetMonthly, etfs);
  res.json(result);
};
