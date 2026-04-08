// ─── ETF 樂退月月配 計算邏輯 ──────────────────────────────────────────────────

function calcOneCapital(capital, etfs, targetMonthly) {
  const capitalPerETF = capital / etfs.length;
  const allocations = etfs.map((etf) => {
    const shares = Math.floor(capitalPerETF / (etf.price * 1000));
    const totalShares = shares * 1000;
    const annualDividend = totalShares * etf.annualDividend;
    const monthlyDividend = annualDividend / 12;
    const investedAmount = shares * etf.price * 1000;
    const dividendYield = investedAmount > 0 ? (annualDividend / investedAmount) * 100 : 0;
    return {
      ticker: etf.ticker,
      name: etf.name,
      price: etf.price,
      shares,
      totalShares,
      annualDividend,
      monthlyDividend,
      investedAmount,
      dividendYield,
    };
  });
  const totalAnnualDividend = allocations.reduce((s, a) => s + a.annualDividend, 0);
  const totalMonthlyDividend = totalAnnualDividend / 12;
  return {
    capital,
    capitalPerETF,
    allocations,
    totalAnnualDividend,
    totalMonthlyDividend,
    achieveTarget: totalMonthlyDividend >= targetMonthly,
  };
}

function calculate(targetMonthly, etfs) {
  const step = 1000000;
  const capitalResults = [];
  let reached = false;
  for (let cap = step; cap <= step * 50; cap += step) {
    const cr = calcOneCapital(cap, etfs, targetMonthly);
    capitalResults.push(cr);
    if (cr.achieveTarget && !reached) {
      reached = true;
      if (capitalResults.length >= 6) {
        capitalResults.push(calcOneCapital(cap + step, etfs, targetMonthly));
        break;
      }
    }
    if (reached && capitalResults.length >= 6) break;
  }
  return {
    targetMonthly,
    etfs,
    capitalResults,
    requiredCapital: capitalResults.find((cr) => cr.achieveTarget)?.capital ?? null,
  };
}

module.exports = { calculate };
