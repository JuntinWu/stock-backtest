# 📈 股票定期定額回測系統

天選之人 vs DCA vs 地獄倒霉鬼 — 真實資料回測工具

## 功能

- 🍀 **天選之人**：每年在最低點投入（年化 × 1）
- 📅 **DCA**：每月固定金額投入
- 😱 **地獄倒霉鬼**：每年在最高點投入
- 真實資料：Yahoo Finance API（調整後股價，含股息）
- XIRR 年化報酬率計算
- 支援台股（加 `.TW`）、美股、ETF

## 快速啟動

### 1. 啟動後端

```bash
cd backend
npm install
npm start
```

後端預設跑在 `http://localhost:3001`

### 2. 啟動前端（新開終端機）

```bash
cd frontend
npm install
npm run dev
```

前端預設跑在 `http://localhost:5173`

### 3. 打開瀏覽器

前往 `http://localhost:5173`

---

## 股票代號格式

| 市場   | 範例                     |
|--------|--------------------------|
| 台股   | `0050.TW`, `2330.TW`, `006208.TW` |
| 美股   | `SPY`, `QQQ`, `AAPL`, `MSFT` |
| 港股   | `0700.HK`               |

---

## 計算說明

### 策略邏輯

- **天選之人**：每年找出最低收盤價那天，投入「月投金額 × 12」
- **DCA**：每月第一個交易日，投入設定的月投金額
- **地獄倒霉鬼**：每年找出最高收盤價那天，投入「月投金額 × 12」

### IRR 計算

使用 XIRR（Extended Internal Rate of Return）：
每次買入為負現金流，最終市值為正現金流，Newton-Raphson 求解年化報酬率。

### 注意事項

- 使用 `adjClose`（調整後收盤價），已反映股息再投入與股票分割
- 回測為理想情況，未計算手續費、稅費
- 「天選之人」與「地獄倒霉鬼」為事後諸葛（hindsight），現實中不可能預知

---

## 技術架構

```
stock-backtest/
├── backend/           # Node.js + Express
│   └── index.js      # 資料抓取 + 回測計算 API
└── frontend/          # React + TypeScript + Vite
    └── src/
        ├── App.tsx
        ├── components/
        │   ├── BacktestForm.tsx
        │   ├── ResultChart.tsx    # Recharts 走勢圖
        │   └── ResultSummary.tsx  # 策略比較卡片
        └── types.ts
```

## 授權

MIT — 自由使用，請勿用於商業投資建議
