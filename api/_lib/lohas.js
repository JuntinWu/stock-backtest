const { getPrice, groupByYearMonth } = require('./yahoo');

// ─── LOHAS Five Lines (樂活五線譜) ──────────────────────────────────────────────
// Log-linear regression on monthly closing prices, then project bands onto daily data

function computeLohas(history, sigmaMult = 2) {
  // 1. Extract monthly closing prices for regression
  const byYearMonth = groupByYearMonth(history);
  const sortedMonths = Object.entries(byYearMonth)
    .sort(([a], [b]) => a.localeCompare(b));

  const monthly = sortedMonths.map(([monthKey, { last }]) => ({
    date: monthKey,
    price: getPrice(last),
  }));

  if (monthly.length < 6) {
    throw new Error('資料不足，至少需要 6 個月的歷史資料');
  }

  const n = monthly.length;

  // 2. Compute ln(price) for regression (monthly basis)
  const xs = monthly.map((_, i) => i);
  const ys = monthly.map((m) => Math.log(m.price));

  // 3. OLS linear regression: y = slope * x + intercept
  const sumX = xs.reduce((s, x) => s + x, 0);
  const sumY = ys.reduce((s, y) => s + y, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const sumX2 = xs.reduce((s, x) => s + x * x, 0);

  const denom = n * sumX2 - sumX * sumX;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // 4. Residuals and standard deviation (n-2 degrees of freedom)
  const residuals = ys.map((y, i) => y - (slope * xs[i] + intercept));
  const ssRes = residuals.reduce((s, r) => s + r * r, 0);
  const sigma = Math.sqrt(ssRes / (n - 2));

  // 5. R-squared
  const meanY = sumY / n;
  const ssTot = ys.reduce((s, y) => s + (y - meanY) * (y - meanY), 0);
  const rSquared = 1 - ssRes / ssTot;

  // 6. CV (coefficient of variation)
  const cv = sigma / Math.abs(meanY);

  // 7. Generate daily chart data — daily close + 5 trend lines
  //    Map each daily row to a fractional month index for smooth line projection
  const firstDate = history[0].date.getTime();
  const lastDate = history[history.length - 1].date.getTime();
  const totalMs = lastDate - firstDate;
  const totalMonthSpan = n - 1; // month indices go from 0 to n-1

  const dailyData = history.map((row) => {
    const price = getPrice(row);
    // Fractional month index based on time position
    const frac = totalMs > 0
      ? ((row.date.getTime() - firstDate) / totalMs) * totalMonthSpan
      : 0;
    const trendLog = slope * frac + intercept;
    return {
      date: row.date.toISOString().split('T')[0],
      close: Math.round(price * 100) / 100,
      trend: Math.round(Math.exp(trendLog) * 100) / 100,
      plus1s: Math.round(Math.exp(trendLog + sigma) * 100) / 100,
      plus2s: Math.round(Math.exp(trendLog + sigmaMult * sigma) * 100) / 100,
      minus1s: Math.round(Math.exp(trendLog - sigma) * 100) / 100,
      minus2s: Math.round(Math.exp(trendLog - sigmaMult * sigma) * 100) / 100,
    };
  });

  // Sample to max ~500 points for performance (still looks smooth)
  const chartData = dailyData.length > 500
    ? dailyData.filter((_, i) => i % Math.ceil(dailyData.length / 500) === 0)
    : dailyData;

  // Ensure last point is always included
  if (chartData[chartData.length - 1].date !== dailyData[dailyData.length - 1].date) {
    chartData.push(dailyData[dailyData.length - 1]);
  }

  // 8. Determine current zone
  const last = chartData[chartData.length - 1];
  const currentPrice = last.close;
  let zone;
  if (currentPrice >= last.plus2s) zone = 'extremely_optimistic';
  else if (currentPrice >= last.plus1s) zone = 'optimistic';
  else if (currentPrice >= last.minus1s) zone = 'fair';
  else if (currentPrice >= last.minus2s) zone = 'pessimistic';
  else zone = 'extremely_pessimistic';

  // 9. Current line values (for right-side labels)
  const lineValues = {
    plus2s: last.plus2s,
    plus1s: last.plus1s,
    trend: last.trend,
    minus1s: last.minus1s,
    minus2s: last.minus2s,
  };

  return {
    chartData,
    currentPrice,
    currentDate: last.date,
    zone,
    rSquared: Math.round(rSquared * 10000) / 10000,
    cv: Math.round(cv * 10000) / 10000,
    lineValues,
  };
}

module.exports = { computeLohas };
