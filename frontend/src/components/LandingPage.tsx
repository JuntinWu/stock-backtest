type Tab = 'backtest' | 'lohas' | 'etf'

interface Props {
  onNavigate: (tab: Tab) => void
}

export default function LandingPage({ onNavigate }: Props) {
  return (
    <div className="lp">
      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <svg className="lp-hero-line" viewBox="0 0 1000 400" preserveAspectRatio="none" fill="none">
          <path d="M0 400 L100 380 L250 320 L400 350 L550 220 L700 240 L850 120 L1000 50"
            stroke="var(--accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="lp-hero-inner">
          <div className="lp-pill">
            資料來源：Yahoo Finance 歷史公開資料 | 僅供研究參考
          </div>
          <h1 className="lp-title">
            StockPilot <span className="lp-title-gradient">投資策略全解析</span>
          </h1>
          <p className="lp-subtitle">
            從定期定額到月月配息 — 用數據理解每一種投資邏輯
          </p>
          <div className="lp-cta-row">
            <button className="lp-cta-primary" onClick={() => onNavigate('backtest')}>開始策略分析</button>
            <button className="lp-cta-secondary" onClick={() => onNavigate('lohas')}>查看五線譜</button>
          </div>
        </div>
      </section>

      {/* ─── Magazine Editorial Sections ──────────────────────────────── */}
      <section className="lp-mag">
        {/* Article 1: Backtest — text left, visual right */}
        <article className="lp-mag-row" onClick={() => onNavigate('backtest')} role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('backtest') }}>
          <div className="lp-mag-text">
            <span className="material-symbols-outlined lp-mag-icon">help</span>
            <h2 className="lp-mag-title">我該什麼時候買？</h2>
            <div className="lp-mag-divider" />
            <p className="lp-mag-body">
              用歷史資料回答一個常被討論的問題：不同進場時機下，長期績效差距有多大？
              工具會以 XIRR 計算四種策略的年化報酬率，讓您從數據中形成自己的觀察。
            </p>
            <div className="lp-mag-insight">
              <span className="material-symbols-outlined">south</span>
              <span>INSIGHT: BACKTESTING METHODOLOGY</span>
            </div>
          </div>
          <div className="lp-mag-visual-wrap">
            <div className="lp-dash">
              <div className="lp-dash-header">
                <span className="lp-dash-eyebrow">STRATEGY DASHBOARD</span>
                <span className="lp-dash-tag">回測四策略</span>
              </div>
              <div className="lp-dash-grid">
                <div className="lp-dash-cell">
                  <div className="lp-chart-bars">
                    <div className="bar" style={{ height: '50%', background: 'var(--bg-secondary)' }} />
                    <div className="bar" style={{ height: '66%', background: 'var(--bg-secondary)' }} />
                    <div className="bar" style={{ height: '100%', background: 'var(--accent)' }} />
                  </div>
                  <p className="lp-dash-label">單筆投入</p>
                </div>
                <div className="lp-dash-cell">
                  <div className="lp-chart-bars">
                    <div className="bar wide" style={{ height: '33%', background: 'var(--bg-secondary)' }} />
                    <div className="bar wide" style={{ height: '75%', background: 'var(--accent)' }} />
                    <div className="bar wide" style={{ height: '50%', background: 'var(--bg-secondary)' }} />
                  </div>
                  <p className="lp-dash-label">年度最低點</p>
                </div>
                <div className="lp-dash-cell">
                  <div className="lp-chart-curve">
                    <svg viewBox="0 0 60 30" fill="none" style={{ width: 60, height: 30 }}>
                      <path d="M0 25 Q15 28 30 15 T60 5" stroke="var(--accent)" strokeWidth="2.5" fill="none" />
                      <circle cx="60" cy="5" r="3" fill="var(--accent)" />
                    </svg>
                  </div>
                  <p className="lp-dash-label">不擇時DCA</p>
                </div>
                <div className="lp-dash-cell">
                  <div className="lp-chart-bars">
                    <div className="bar" style={{ height: '25%', background: 'var(--bg-secondary)' }} />
                    <div className="bar" style={{ height: '50%', background: 'var(--bg-secondary)' }} />
                    <div className="bar" style={{ height: '75%', background: 'var(--bg-secondary)' }} />
                    <div className="bar" style={{ height: '100%', background: 'var(--accent)' }} />
                  </div>
                  <p className="lp-dash-label">年度最高點</p>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Article 2: LOHAS — visual left, text right */}
        <article className="lp-mag-row lp-mag-row-reverse" onClick={() => onNavigate('lohas')} role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('lohas') }}>
          <div className="lp-mag-visual-wrap">
            <div className="lp-dash">
              <div className="lp-dash-header">
                <span className="lp-dash-eyebrow">MARKET VALUATION LINE</span>
                <span className="lp-dash-tag">樂活五線譜</span>
              </div>
              <div className="lp-lohas-chart">
                <div className="lp-lohas-lines">
                  {[
                    { label: '+2SD 昂貴', emphasis: false },
                    { label: '+1SD 偏貴', emphasis: false },
                    { label: '平均線 合理', emphasis: true },
                    { label: '-1SD 便宜', emphasis: false },
                    { label: '-2SD 低估', emphasis: false },
                  ].map((l) => (
                    <div key={l.label} className="lp-lohas-line-row">
                      <div className={`lp-lohas-hline ${l.emphasis ? 'emphasis' : ''}`} />
                      <span className={`lp-lohas-label ${l.emphasis ? 'emphasis' : ''}`}>{l.label}</span>
                    </div>
                  ))}
                </div>
                <svg className="lp-lohas-path" viewBox="0 0 400 200" preserveAspectRatio="none" fill="none">
                  <path d="M0 160 L40 120 L80 145 L120 90 L160 130 L200 70 L240 110 L280 50 L320 100 L360 40 L400 80"
                    stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
          <div className="lp-mag-text">
            <span className="material-symbols-outlined lp-mag-icon">balance</span>
            <h2 className="lp-mag-title">現在算貴還便宜？</h2>
            <div className="lp-mag-divider" />
            <p className="lp-mag-body">
              基於統計學的均值回歸假設，對歷史對數價格做線性迴歸並畫出 ±1、±2 個標準差的參考線，
              呈現目前價格相對長期趨勢的位置。僅為歷史統計視覺化，不代表未來走勢。
            </p>
            <div className="lp-mag-insight">
              <span className="material-symbols-outlined">south</span>
              <span>ANALYSIS: MEAN REVERSION MATRIX</span>
            </div>
          </div>
        </article>

        {/* Article 3: Monthly Dividend — text left, visual right */}
        <article className="lp-mag-row" onClick={() => onNavigate('etf')} role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('etf') }}>
          <div className="lp-mag-text">
            <span className="material-symbols-outlined lp-mag-icon">calendar_month</span>
            <h2 className="lp-mag-title">退休現金流怎麼造？</h2>
            <div className="lp-mag-divider" />
            <p className="lp-mag-body">
              以您自行輸入的 ETF 股價、配息資料為基礎，試算不同本金與配置策略下的月現金流分佈，
              幫助您理解「配息組合」背後的數學結構。計算結果不構成推薦或保證。
            </p>
            <div className="lp-mag-insight">
              <span className="material-symbols-outlined">south</span>
              <span>INSIGHT: PASSIVE INCOME STREAMS</span>
            </div>
          </div>
          <div className="lp-mag-visual-wrap">
            <div className="lp-dash">
              <div className="lp-dash-header">
                <span className="lp-dash-eyebrow">CASH FLOW PROJECTION</span>
                <span className="lp-dash-tag">樂退月月配</span>
              </div>
              <div className="lp-cash-top">
                <div className="lp-cash-source">
                  <div className="lp-cash-vessel">
                    <span className="material-symbols-outlined lp-cash-arrow">keyboard_double_arrow_down</span>
                    <div className="lp-cash-coin">$</div>
                  </div>
                  <p className="lp-cash-caption">複利資源</p>
                </div>
                <span className="material-symbols-outlined lp-cash-flow">trending_flat</span>
                <div className="lp-cash-stats">
                  <div>
                    <p className="lp-cash-stat-value">3.3%</p>
                    <p className="lp-cash-stat-label">殖利率</p>
                  </div>
                  <div className="lp-cash-divider" />
                  <div>
                    <p className="lp-cash-stat-value">12</p>
                    <p className="lp-cash-stat-label">月月有</p>
                  </div>
                </div>
              </div>
              <div className="lp-cash-months">
                {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map((m) => (
                  <div key={m} className="lp-cash-month">
                    <span className="lp-cash-month-dollar">$</span>
                    <span className="lp-cash-month-label">{m}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* ─── Core Concept ─────────────────────────────────────────────── */}
      <section className="lp-concept-section">
        <div className="lp-concept-banner">
          {'\u{1F4A1}'} 核心觀念：投資沒有完美時機，但有可以驗證的策略。
        </div>
      </section>

      {/* ─── Data & Methodology ───────────────────────────────────────── */}
      <section className="lp-engine-section">
        <div className="lp-engine-grid">
          <div className="lp-engine-main">
            <div className="lp-engine-orb" />
            <h4 className="lp-engine-eyebrow">DATA & METHODOLOGY</h4>
            <h2 className="lp-engine-headline">
              基於公開歷史資料<br />透明、可驗證的計算
            </h2>
            <div className="lp-engine-stats">
              <div className="lp-engine-stat">
                <div className="lp-engine-stat-value">20+ yr</div>
                <div className="lp-engine-stat-label">HISTORY</div>
              </div>
              <div className="lp-engine-stat">
                <div className="lp-engine-stat-value">XIRR</div>
                <div className="lp-engine-stat-label">METHOD</div>
              </div>
              <div className="lp-engine-stat lp-engine-stat-hide-sm">
                <div className="lp-engine-stat-value">OSS</div>
                <div className="lp-engine-stat-label">OPEN SOURCE</div>
              </div>
            </div>
          </div>
          <div className="lp-engine-insight">
            <h4 className="lp-engine-insight-title">
              <span className="material-symbols-outlined">info</span>
              關於本工具
            </h4>
            <p className="lp-engine-insight-body">
              StockPilot 為<strong>教育與研究用途</strong>的開放工具，所有計算邏輯透明可查，
              資料來源為 Yahoo Finance 歷史收盤價。本站不提供個股推薦、不預測市場走勢、
              不保證任何報酬。使用前請詳閱免責聲明。
            </p>
            <button className="lp-engine-insight-link" onClick={() => onNavigate('backtest')}>
              開始使用工具
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
