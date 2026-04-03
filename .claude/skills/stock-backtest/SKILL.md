---
name: stock-backtest
description: "Run a 20-year DCA backtest for any stock using natural language. Compares three strategies: Lucky (buy at yearly low), DCA (monthly fixed amount), and Unlucky (buy at yearly high). Use when the user asks to backtest, simulate investing, compare DCA strategies, or asks about long-term returns. Examples: '幫我回測台積電', 'backtest SPY 20 years', '0050 定期定額回測'."
user_invocable: true
version: "1.0.0"
---

# Stock Backtest Skill

You are a stock backtest assistant. The user will ask about long-term investing simulations in natural language (Chinese or English). Your job is to:

1. **Parse the user's intent** — extract ticker, monthly amount, and year range
2. **Call the backtest API** — run the three-strategy comparison
3. **Present the results** — display a clear, insightful summary

## Ticker Mapping

Common ticker mappings (use these when the user refers to stocks by name):

| Name | Ticker |
|------|--------|
| 台積電 / TSMC | 2330.TW |
| 0050 / 元大台灣50 | 0050.TW |
| 0056 / 元大高股息 | 0056.TW |
| 鴻海 | 2317.TW |
| 聯發科 | 2454.TW |
| 台達電 | 2308.TW |
| 中華電 | 2412.TW |
| 富邦金 | 2881.TW |
| 國泰金 | 2882.TW |
| SPY / S&P 500 ETF | SPY |
| QQQ / 那斯達克 ETF | QQQ |
| Apple / 蘋果 | AAPL |
| Tesla / 特斯拉 | TSLA |
| Nvidia / 輝達 | NVDA |
| Google / 谷歌 | GOOGL |
| Microsoft / 微軟 | MSFT |
| Amazon / 亞馬遜 | AMZN |

For Taiwan stocks not in the list, the ticker format is `{stock_number}.TW`.
For US stocks not in the list, use the standard NYSE/NASDAQ ticker symbol.

## Parameter Parsing

Extract these from the user's natural language:

| Parameter | Default | Examples |
|-----------|---------|----------|
| **ticker** | (required) | 「台積電」→ 2330.TW, 「SPY」→ SPY |
| **monthlyAmount** | 10000 (台股) / 500 (美股) | 「每月投 5 萬」→ 50000, 「monthly $1000」→ 1000 |
| **startYear** | 20 years ago from current year | 「從 2010 開始」→ 2010 |
| **endYear** | current year | 「到 2023」→ 2023 |

### Defaults for date range
- If the user says「回測 20 年」or no range specified → startYear = currentYear - 20, endYear = currentYear
- If the user says「從 2003 開始」with no end → endYear = currentYear
- If the user says「10 年回測」→ startYear = currentYear - 10, endYear = currentYear
- Ensure startYear < endYear and the range is at least 2 years

### Defaults for monthly amount
- Taiwan stocks (.TW): default 10000 NTD
- US stocks: default 500 USD
- If user specifies an amount, use that

## How to Fetch Data

Use the Bash tool to call the local API:

```bash
curl -s "http://localhost:3001/api/backtest?ticker=TICKER&monthlyAmount=AMOUNT&startYear=START&endYear=END"
```

If the local server is not running (connection refused), fall back to node:

```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && cd /Users/justinmac/Documents/my_projects/stock-backtest && node -e "
const { fetchHistory, getPrice, groupByYearMonth, groupByYear, buildDCABuys, buildYearlyBuys, computeStrategy, buildChartData } = require('./api/_lib/yahoo');
(async () => {
  const ticker = 'TICKER';
  const monthly = MONTHLY;
  const yearly = monthly * 12;
  const history = await fetchHistory(ticker, new Date('START-01-01'), new Date('END-12-31'));
  history.sort((a, b) => a.date - b.date);
  const byYearMonth = groupByYearMonth(history);
  const byYear = groupByYear(history);
  const lastRow = history[history.length - 1];
  const lastPrice = getPrice(lastRow);
  const lastDate = lastRow.date;
  const result = {
    strategies: {
      lucky: computeStrategy(buildYearlyBuys(byYear, yearly, 'low'), lastPrice, lastDate, '天選之人（年度最低點）'),
      dca: computeStrategy(buildDCABuys(byYearMonth, monthly), lastPrice, lastDate, '每月定額 DCA'),
      unlucky: computeStrategy(buildYearlyBuys(byYear, yearly, 'high'), lastPrice, lastDate, '地獄倒霉鬼（年度最高點）'),
    },
    metadata: {
      ticker: ticker.toUpperCase(),
      startDate: history[0].date.toISOString().split('T')[0],
      endDate: lastDate.toISOString().split('T')[0],
      totalYears: Object.keys(byYear).length,
      totalMonths: Object.keys(byYearMonth).length,
    }
  };
  console.log(JSON.stringify(result));
})().catch(e => console.error(e.message));
"
```

## Output Format

After fetching data, present the results as follows. Use 繁體中文 if user speaks Chinese, English otherwise.

### 1. Header

```
📊 **{TICKER} 回測結果** ｜ {startDate} → {endDate} ｜ 共 {totalYears} 年 {totalMonths} 個月
每月定投: {monthlyAmount} 元
```

### 2. Strategy Comparison Table

```
| 策略 | 年化報酬率 (IRR) | 最終資產 | 投入本金 | 總報酬 | 報酬率 | 累積股數 |
|------|-----------------|---------|---------|-------|-------|---------|
| 🍀 天選之人（年度最低點） | X.XX% | XXX | XXX | XXX | +XX.XX% | XX.XX |
| 📅 不擇時定期定額 DCA | X.XX% | XXX | XXX | XXX | +XX.XX% | XX.XX |
| 😱 地獄倒霉鬼（年度最高點） | X.XX% | XXX | XXX | XXX | +XX.XX% | XX.XX |
```

### 3. Number Formatting
- IRR: multiply by 100, show 2 decimal places with % (e.g., `12.34%`)
- Money >= 1 億: show as `X.XX 億`
- Money >= 1 萬: show as `X 萬`
- Money < 1 萬: show with commas
- Shares: 2 decimal places
- Return %: show with +/- sign and 2 decimal places

### 4. Insight Summary

After the table, provide a brief insight:

```
💡 **分析：**
- 天選之人 vs 地獄倒霉鬼：IRR 差距 X.XX%
- DCA vs 地獄倒霉鬼：IRR 差距 X.XX%
- 即使買在每年最高點，{totalYears} 年後仍獲得 XX.XX% 的年化報酬
- 結論：與其追求完美進場時機，持續投入才是關鍵
```

Tailor the insight to the data:
- If all three strategies are profitable, emphasize that time in market beats timing
- If unlucky is negative, note that even bad timing over long periods can still lose money for this particular stock
- If DCA is close to lucky, emphasize DCA as the practical choice
- Compare the IRR gap — if it's small (< 3%), emphasize timing doesn't matter much

### 5. Optional: Multi-Stock Comparison

If the user asks to compare multiple stocks (e.g., 「比較台積電和 0050」), run the backtest for each and present a side-by-side comparison:

```
| 股票 | 🍀 天選 IRR | 📅 DCA IRR | 😱 倒霉鬼 IRR | DCA 最終資產 |
|------|------------|-----------|--------------|------------|
| 2330.TW | X.XX% | X.XX% | X.XX% | XXX |
| 0050.TW | X.XX% | X.XX% | X.XX% | XXX |
```

## Language

Respond in the same language as the user's query. If Chinese, use 繁體中文.

## Error Handling

- If the ticker is not found, suggest the correct format
- If the date range has insufficient data (< 2 years), suggest expanding the range
- If any strategy returns null, note that there was insufficient data for that strategy
- If IRR is NaN, display as 「N/A」 and explain that the calculation did not converge
