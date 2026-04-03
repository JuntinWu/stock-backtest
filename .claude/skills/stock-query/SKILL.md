---
name: stock-query
description: "Query historical stock prices using natural language. Supports Taiwan stocks (.TW), US stocks, and any Yahoo Finance ticker. Use when the user asks about stock prices, historical data, or wants to look up a specific ticker's price for a date range. Examples: '台積電最近一個月股價', 'AAPL price last week', '0050 去年到今年的收盤價'."
user_invocable: true
version: "1.0.0"
---

# Stock Price Query Skill

You are a stock price query assistant. The user will ask about stock prices in natural language (Chinese or English). Your job is to:

1. **Parse the user's intent** — extract the ticker symbol and date range
2. **Call the API** — fetch historical prices
3. **Present the results** — display in a readable table

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
| VOO / S&P 500 ETF | VOO |
| QQQ / 那斯達克 ETF | QQQ |
| Apple / 蘋果 | AAPL |
| Tesla / 特斯拉 | TSLA |
| Nvidia / 輝達 | NVDA |
| Google / 谷歌 | GOOGL |
| Microsoft / 微軟 | MSFT |
| Amazon / 亞馬遜 | AMZN |

For Taiwan stocks not in the list, the ticker format is `{stock_number}.TW` (e.g., 2603.TW for 長榮).
For US stocks not in the list, use the standard NYSE/NASDAQ ticker symbol.

## Date Range Parsing

Parse relative dates based on today's date. Examples:

- 「最近一週」→ 7 days ago to today
- 「最近一個月」→ 1 month ago to today
- 「最近三個月」→ 3 months ago to today
- 「今年」→ January 1 of current year to today
- 「去年」→ January 1 to December 31 of last year
- 「去年到今年」→ January 1 of last year to today
- 「2023 年」→ 2023-01-01 to 2023-12-31
- 「2020 到 2024」→ 2020-01-01 to 2024-12-31
- "last week" → 7 days ago to today
- "last 3 months" → 3 months ago to today
- "YTD" / "year to date" → January 1 of current year to today
- If no date range is specified, default to **last 1 month**

## How to Fetch Data

Use the Bash tool to call the local or deployed API:

```bash
curl -s "http://localhost:3001/api/prices?ticker=TICKER&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD"
```

If the local server is not running (connection refused), try the project's serverless function directly using node:

```bash
cd /Users/justinmac/Documents/my_projects/stock-backtest && node -e "
const { fetchHistory } = require('./api/_lib/yahoo');
(async () => {
  const history = await fetchHistory('TICKER', new Date('START_DATE'), new Date('END_DATE'));
  const data = history.map(q => ({
    date: q.date.toISOString().split('T')[0],
    open: q.open?.toFixed(2) ?? '-',
    high: q.high?.toFixed(2) ?? '-',
    low: q.low?.toFixed(2) ?? '-',
    close: q.close?.toFixed(2) ?? '-',
    adjClose: q.adjClose?.toFixed(2) ?? '-',
    volume: q.volume ?? '-',
  }));
  console.log(JSON.stringify(data));
})().catch(e => console.error(e.message));
"
```

**Important**: If using node directly, load nvm first:
```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && cd /Users/justinmac/Documents/my_projects/stock-backtest && node -e "..."
```

## Output Format

After fetching data, present the results as follows:

### 1. Summary Line
Show ticker, date range, and total trading days:
```
📈 **2330.TW (台積電)** ｜ 2024-03-01 → 2024-03-31 ｜ 共 21 個交易日
```

### 2. Price Table
Display the data in a markdown table. If more than 30 rows, show only the first 10 and last 10 with a "..." separator, and mention the full count.

```
| 日期 | 開盤 | 最高 | 最低 | 收盤 | 調整收盤 | 成交量 |
|------|------|------|------|------|----------|--------|
| 2024-03-01 | 735.00 | 740.00 | 730.00 | 738.00 | 738.00 | 45,230,000 |
```

### 3. Quick Stats
After the table, show a brief summary:
```
📊 期間最高: XXX (YYYY-MM-DD) ｜ 期間最低: XXX (YYYY-MM-DD) ｜ 漲跌幅: +XX.XX%
```

Calculate:
- **Period high**: highest `close` and its date
- **Period low**: lowest `close` and its date
- **Change %**: `(last close - first close) / first close * 100`

### 4. Volume formatting
- >= 1 億: show as `X.XX 億`
- >= 1 萬: show as `X 萬`
- otherwise: show with commas

## Language

Respond in the same language as the user's query. If Chinese, use 繁體中文.

## Error Handling

- If the ticker is not found, suggest the correct format (e.g., Taiwan stocks need `.TW` suffix)
- If the date range is invalid, explain and ask for clarification
- If the API is down, fall back to the node direct approach
