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
            資料來源：歷史回測數據整合 | 核心演算法啟動
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

      {/* ─── Feature Cards ────────────────────────────────────────────── */}
      <section className="lp-cards-section">
        <div className="lp-cards-grid">
          {/* Card 1: Backtest */}
          <div className="lp-card" onClick={() => onNavigate('backtest')} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('backtest') }}>
            <span className="material-symbols-outlined lp-card-icon">help</span>
            <h3 className="lp-card-question">我該什麼時候買？</h3>
            <span className="material-symbols-outlined lp-card-arrow">south</span>
            <div className="lp-card-title-bar">回測四策略</div>
            <div className="lp-card-visual">
              <div className="lp-visual-grid-4">
                {[
                  { icon: '\u26A1', label: '單筆投入' },
                  { icon: '\u{1F451}', label: '天選之人' },
                  { icon: '\u{1F4C5}', label: '每月定額' },
                  { icon: '\u{1F494}', label: '地獄倒霉鬼' },
                ].map((s) => (
                  <div key={s.label} className="lp-visual-item">
                    <span className="lp-visual-item-icon">{s.icon}</span>
                    <span className="lp-visual-item-label">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: LOHAS */}
          <div className="lp-card" onClick={() => onNavigate('lohas')} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('lohas') }}>
            <span className="material-symbols-outlined lp-card-icon">balance</span>
            <h3 className="lp-card-question">現在算貴還便宜？</h3>
            <span className="material-symbols-outlined lp-card-arrow">south</span>
            <div className="lp-card-title-bar">樂活五線譜</div>
            <div className="lp-card-visual">
              <svg viewBox="0 0 220 130" fill="none" style={{ width: '100%', height: 130 }}>
                <line x1="15" y1="15" x2="175" y2="10" stroke="#ef4444" strokeWidth="1.2" opacity="0.5" />
                <line x1="15" y1="35" x2="175" y2="28" stroke="#f97316" strokeWidth="1.2" opacity="0.5" />
                <line x1="15" y1="58" x2="175" y2="48" stroke="#9ca3af" strokeWidth="1.2" opacity="0.6" />
                <line x1="15" y1="80" x2="175" y2="68" stroke="#3b82f6" strokeWidth="1.2" opacity="0.5" />
                <line x1="15" y1="100" x2="175" y2="85" stroke="#8b5cf6" strokeWidth="1.2" opacity="0.5" />
                <text x="178" y="14" fontSize="8" fill="var(--text-muted)">+2SD 昂貴</text>
                <text x="178" y="32" fontSize="8" fill="var(--text-muted)">+1SD 偏貴</text>
                <text x="178" y="52" fontSize="8" fill="var(--text-muted)">平均線 合理</text>
                <text x="178" y="72" fontSize="8" fill="var(--text-muted)">-1SD 便宜</text>
                <text x="178" y="89" fontSize="8" fill="var(--text-muted)">-2SD 低估</text>
                <polyline points="15,90 35,60 55,80 75,50 95,75 115,40 135,65 155,30 175,20"
                  stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Card 3: Monthly Dividend */}
          <div className="lp-card" onClick={() => onNavigate('etf')} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('etf') }}>
            <span className="material-symbols-outlined lp-card-icon">calendar_month</span>
            <h3 className="lp-card-question">退休現金流怎麼造？</h3>
            <span className="material-symbols-outlined lp-card-arrow">south</span>
            <div className="lp-card-title-bar">樂退月月配</div>
            <div className="lp-card-visual">
              <div className="lp-month-grid">
                {Array.from({ length: 12 }, (_, i) => {
                  const colors = ['#34d399', '#38bdf8', '#fbbf24']
                  const c = colors[i % 3]
                  return (
                    <div key={i} className="lp-month-cell" style={{ borderColor: `${c}60`, background: `${c}15` }}>
                      <span className="lp-month-dollar" style={{ color: c }}>$</span>
                      <span className="lp-month-label">{i + 1}月</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Core Concept ─────────────────────────────────────────────── */}
      <section className="lp-concept-section">
        <div className="lp-concept-banner">
          {'\u{1F4A1}'} 核心觀念：投資沒有完美時機，但有可以驗證的策略。
        </div>
      </section>

      {/* ─── Stats Bento ──────────────────────────────────────────────── */}
      <section className="lp-stats-section">
        <div className="lp-stats-grid">
          <div className="lp-stats-main">
            <span className="lp-stats-eyebrow">ADVANCED ANALYTICS</span>
            <h2 className="lp-stats-headline">
              掌握全市場 20+ 年<br />深度回測引擎
            </h2>
            <div className="lp-stats-numbers">
              <div className="lp-stat-item">
                <div className="lp-stat-value">99.8%</div>
                <div className="lp-stat-label">數據準確度</div>
              </div>
              <div className="lp-stat-item">
                <div className="lp-stat-value">5,000+</div>
                <div className="lp-stat-label">模擬組合</div>
              </div>
              <div className="lp-stat-item lp-stat-hide-mobile">
                <div className="lp-stat-value">15ms</div>
                <div className="lp-stat-label">即時運算</div>
              </div>
            </div>
          </div>
          <div className="lp-stats-insight">
            <h4 className="lp-insight-title">今日市場觀察</h4>
            <p className="lp-insight-body">
              目前的市場五線譜顯示大部分藍籌股處於「均值」區間，定期定額（DCA）仍然是當前波動環境下的最佳策略。
            </p>
            <button className="lp-insight-link" onClick={() => onNavigate('lohas')}>
              查看完整分析 &rarr;
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
