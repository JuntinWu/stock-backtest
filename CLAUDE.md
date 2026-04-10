# CLAUDE.md

專案指引：StockPilot — 投資策略分析工具

## 專案概述

用 Yahoo Finance 歷史股價提供四大功能：回測四策略、樂活五線譜、樂退月月配、歷史價格查詢。部署在 Vercel。

## 技術架構

```
stock-backtest/
├── api/                    # Vercel Serverless Functions（production）
│   ├── _lib/
│   │   ├── yahoo.js        # Yahoo Finance + XIRR 共用
│   │   ├── lohas.js        # 五線譜迴歸
│   │   └── etf-dividend.js # 月月配 4 策略（純計算）
│   ├── backtest.js         # GET — 四策略回測
│   ├── lohas.js            # GET — 五線譜
│   ├── etf-dividend.js     # POST — 月月配
│   └── prices.js           # GET — 歷史價格
├── backend/
│   └── index.js            # 本地 Express server (port 3001)
├── frontend/               # Vite + React 18 + TS
│   └── src/
│       ├── App.tsx         # 路由：landing / backtest / lohas / prices / etf
│       ├── types.ts
│       └── components/
│           ├── LandingPage.tsx  # 首頁（Stitch 風格）
│           ├── BacktestForm.tsx / ResultSummary / ResultChart
│           ├── LOHASAnalysis.tsx
│           ├── ETFDividend.tsx  # 樂退月月配
│           └── PriceLookup.tsx
└── vercel.json             # rewrites /api/* → functions
```

**Stack**：React 18、TypeScript、Vite、Recharts、Express（本地）、Vercel Functions（prod）、yahoo-finance2

## 常用指令

```bash
# 本地開發（需兩個 terminal）
cd backend  && npm start        # API server → localhost:3001
cd frontend && npm run dev      # Vite dev   → localhost:5173（已 proxy /api）

# Build / Type check
cd frontend && npx tsc --noEmit
cd frontend && npx vite build

# 部署
vercel --prod
```

## 路由與導航

- 使用 **hash-based routing**（非 react-router）
- `#` 無 hash → landing page（首頁）
- `#backtest` / `#lohas` / `#prices` / `#etf` → 內頁
- 邏輯在 `App.tsx` 的 `useHashNav` hook
- Landing Page 卡片點擊 `onNavigate(tab)` 切換到對應 tab

## 設計系統

### 主題
- 支援 **dark / light** 雙主題，使用 CSS 變數（`:root` 和 `[data-theme="light"]`）
- 切換按鈕在右上角固定位置
- Dark：愛琴海夜景（希臘藍 `#38bdf8`）
- Light：聖托里尼日景（`#0284c7`）

### 字體
- **Manrope** — Landing Page 標題、卡片標題（粗體、專業感）
- **Syne** — 內頁 display 標題
- **Inter** — 內文
- **IBM Plex Mono** — 預設 body、技術元素
- **Space Grotesk** — 數據（Landing Page 統計數字）
- **Material Symbols Outlined** — Landing Page 卡片圖標

### Landing Page（Stitch "Precision Navigator" 風格）
- 參考 `/docs/` 中的 Stitch 設計檔
- **No borders for sectioning** — 用背景色差異分區（`--bg-primary` vs `--bg-secondary`）
- 卡片 `border-radius: 14px`、漸層主標題、藍色 CTA 按鈕
- 三大功能卡片：Material icon + 問題 + 彈跳箭頭 + 藍底標題列 + 視覺圖
- 綠色膠囊概念橫幅 + 藍底 bento stats 區塊

### RWD
- Breakpoint：`@media (max-width: 768px)`
- Landing Page 手機版：卡片單欄、隱藏 `.lp-card-visual`（只留 icon + 問題 + 標題列）
- 其他內頁也需測試手機排版

## 計算核心

### XIRR（Newton-Raphson）
位於 `api/_lib/yahoo.js`，考慮每筆現金流的精確日期，給出等效年化報酬率。

### 五線譜
`api/_lib/lohas.js` — 對 `ln(price)` 做 OLS 線性迴歸、計算殘差標準差、畫五條線。採樣至最多 500 點。

### 樂退月月配 4 策略
`api/_lib/etf-dividend.js`：
- **均等分配** — 每支平分
- **最大配息（貪心法）** — 先各 1 張後全買殖利率最高的
- **殖利率加權** — 按殖利率比例分配
- **月月均配** — 解 `D = capital / Σ(price/dividend)`，讓每支年配息相近

POST `/api/etf-dividend` 一次回傳所有 4 種策略結果，前端切換策略不需重新請求。

## 程式碼偏好

- **不新增檔案** 除非必要；優先修改現有檔案
- **不加 emoji** 到程式碼（使用者特別要求時才加）
- **繁體中文** UI 文案
- CSS 使用現有變數系統（`var(--accent)` 等），避免寫死顏色
- 新功能若涉及計算，**放後端**（使用者明確要求：計算邏輯在後端，前端透過 API 取結果）
- API response shape 變動時，保持向後相容或同時更新 `types.ts`

## 已知限制

- Yahoo Finance 有 15 分鐘延遲、可能 429 rate limit（`fetchWithRetry` 已處理）
- 回測未計算手續費、稅費、滑點
- 月月配使用使用者輸入的股價，非即時抓取
- Vercel function `includeFiles: "api/_lib/**"` 確保 shared lib 被打包
