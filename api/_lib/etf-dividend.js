// ─── ETF 樂退月月配 計算邏輯 ──────────────────────────────────────────────────

const STRATEGIES = ['equal', 'max-dividend', 'yield-weighted', 'equal-monthly'];

// ─── Allocation Strategies ──────────────────────────────────────────────────

function allocateEqual(capital, etfs) {
  const capitalPerETF = capital / etfs.length;
  return etfs.map((etf) => Math.floor(capitalPerETF / (etf.price * 1000)));
}

function allocateMaxDividend(capital, etfs) {
  const shares = new Array(etfs.length).fill(0);
  let remaining = capital;
  const yields = etfs.map((etf) => etf.annualDividend / etf.price);

  // Ensure at least 1 張 each for 月月配
  const minCost = etfs.reduce((s, etf) => s + etf.price * 1000, 0);
  if (remaining >= minCost) {
    for (let i = 0; i < etfs.length; i++) {
      shares[i] = 1;
      remaining -= etfs[i].price * 1000;
    }
  }

  // Greedy: always buy the highest yield ETF
  while (true) {
    let bestIdx = -1;
    let bestYield = -1;
    for (let i = 0; i < etfs.length; i++) {
      const cost = etfs[i].price * 1000;
      if (cost <= remaining && yields[i] > bestYield) {
        bestYield = yields[i];
        bestIdx = i;
      }
    }
    if (bestIdx === -1) break;
    shares[bestIdx]++;
    remaining -= etfs[bestIdx].price * 1000;
  }

  return shares;
}

function allocateYieldWeighted(capital, etfs) {
  const yields = etfs.map((etf) => etf.annualDividend / etf.price);
  const totalYield = yields.reduce((s, y) => s + y, 0);

  const shares = etfs.map((etf, i) => {
    const allocated = capital * (yields[i] / totalYield);
    return Math.floor(allocated / (etf.price * 1000));
  });

  // Use remaining capital greedily by yield
  let remaining = capital - shares.reduce((s, sh, i) => s + sh * etfs[i].price * 1000, 0);
  const sortedByYield = etfs.map((_, i) => i).sort((a, b) => yields[b] - yields[a]);

  for (const idx of sortedByYield) {
    while (etfs[idx].price * 1000 <= remaining) {
      shares[idx]++;
      remaining -= etfs[idx].price * 1000;
    }
  }

  return shares;
}

function allocateEqualMonthly(capital, etfs) {
  // Goal: each ETF produces equal annual dividend
  // shares_i * 1000 * annualDividend_i = D for all i
  // capital = D * sum(price_i / annualDividend_i)
  const ratio = etfs.reduce((s, etf) => s + etf.price / etf.annualDividend, 0);
  const D = capital / ratio;

  const shares = etfs.map((etf) => Math.floor(D / (1000 * etf.annualDividend)));

  // Fill remaining: prefer ETF with lowest current dividend to equalize
  let remaining = capital - shares.reduce((s, sh, i) => s + sh * etfs[i].price * 1000, 0);

  while (true) {
    const currentDividends = shares.map((sh, i) => sh * 1000 * etfs[i].annualDividend);
    let bestIdx = -1;
    let lowestDividend = Infinity;
    for (let i = 0; i < etfs.length; i++) {
      const cost = etfs[i].price * 1000;
      if (cost <= remaining && currentDividends[i] < lowestDividend) {
        lowestDividend = currentDividends[i];
        bestIdx = i;
      }
    }
    if (bestIdx === -1) break;
    shares[bestIdx]++;
    remaining -= etfs[bestIdx].price * 1000;
  }

  return shares;
}

function allocateShares(capital, etfs, strategy) {
  switch (strategy) {
    case 'max-dividend':
      return allocateMaxDividend(capital, etfs);
    case 'yield-weighted':
      return allocateYieldWeighted(capital, etfs);
    case 'equal-monthly':
      return allocateEqualMonthly(capital, etfs);
    default:
      return allocateEqual(capital, etfs);
  }
}

// ─── Core Calculation ───────────────────────────────────────────────────────

function calcOneCapital(capital, etfs, targetMonthly, strategy) {
  const sharesArr = allocateShares(capital, etfs, strategy);
  const allocations = etfs.map((etf, i) => {
    const shares = sharesArr[i];
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
  const totalInvested = allocations.reduce((s, a) => s + a.investedAmount, 0);
  return {
    capital,
    capitalPerETF: capital / etfs.length,
    allocations,
    totalAnnualDividend,
    totalMonthlyDividend,
    totalInvested,
    achieveTarget: totalMonthlyDividend >= targetMonthly,
  };
}

function calculateStrategy(targetMonthly, etfs, strategy) {
  const step = 1000000;
  const capitalResults = [];
  let reached = false;
  for (let cap = step; cap <= step * 50; cap += step) {
    const cr = calcOneCapital(cap, etfs, targetMonthly, strategy);
    capitalResults.push(cr);
    if (cr.achieveTarget && !reached) {
      reached = true;
      if (capitalResults.length >= 6) {
        capitalResults.push(calcOneCapital(cap + step, etfs, targetMonthly, strategy));
        break;
      }
    }
    if (reached && capitalResults.length >= 6) break;
  }
  return {
    capitalResults,
    requiredCapital: capitalResults.find((cr) => cr.achieveTarget)?.capital ?? null,
  };
}

function calculateAll(targetMonthly, etfs) {
  const strategies = {};
  for (const strategy of STRATEGIES) {
    strategies[strategy] = calculateStrategy(targetMonthly, etfs, strategy);
  }
  return { targetMonthly, etfs, strategies };
}

module.exports = { calculateAll, STRATEGIES };
