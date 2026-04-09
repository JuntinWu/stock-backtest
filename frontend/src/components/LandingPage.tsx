type Tab = 'backtest' | 'lohas' | 'prices' | 'etf'

interface Props {
  onNavigate: (tab: Tab) => void
}

// ─── Animated stock chart line (SVG) ─────────────────────────────────────────

function ChartLine() {
  return (
    <svg viewBox="0 0 1200 200" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', bottom: '8%', left: 0, width: '100%', height: '40%', opacity: 0.25, pointerEvents: 'none' }}>
      <polyline
        points="0,180 80,160 160,150 240,140 320,120 400,130 480,110 560,100 640,90 720,80 800,95 880,70 960,55 1040,40 1120,20 1200,10"
        stroke="var(--accent)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Feature Card ────────────────────────────────────────────────────────────

interface CardProps {
  icon: string
  question: string
  title: string
  description: string
  visual: React.ReactNode
  onClick: () => void
}

function FeatureCard({ icon, question, title, description, visual, onClick }: CardProps) {
  return (
    <div className="landing-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}>
      <div className="landing-card-icon">{icon}</div>
      <div className="landing-card-question">{question}</div>
      <div className="landing-card-arrow">&darr;</div>
      <div className="landing-card-title">{title}</div>
      <div className="landing-card-visual">{visual}</div>
      <div className="landing-card-desc">{description}</div>
      <div className="landing-card-cta">
        開始使用 &rarr;
      </div>
    </div>
  )
}

// ─── Mini visuals for each card ──────────────────────────────────────────────

function BacktestVisual() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', width: '100%' }}>
      {[
        { icon: '\u{1F4C8}', label: 'DCA 定期定額' },
        { icon: '\u26A1', label: '單筆投入' },
        { icon: '\u{1F451}', label: '天選之人' },
        { icon: '\u{1F494}', label: '地獄倒霉鬼' },
      ].map((s) => (
        <div key={s.label} style={{
          background: 'var(--accent-glow)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '0.5rem', textAlign: 'center', fontSize: '0.7rem',
          color: 'var(--text-secondary)',
        }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{s.icon}</div>
          {s.label}
        </div>
      ))}
    </div>
  )
}

function LohasVisual() {
  return (
    <svg viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 80 }}>
      {/* Five lines */}
      <line x1="10" y1="15" x2="190" y2="10" stroke="#ef4444" strokeWidth="1.5" opacity="0.7" />
      <line x1="10" y1="30" x2="190" y2="22" stroke="#f97316" strokeWidth="1.5" opacity="0.7" />
      <line x1="10" y1="50" x2="190" y2="38" stroke="#9ca3af" strokeWidth="1.5" opacity="0.7" />
      <line x1="10" y1="68" x2="190" y2="55" stroke="#3b82f6" strokeWidth="1.5" opacity="0.7" />
      <line x1="10" y1="85" x2="190" y2="70" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.7" />
      {/* Labels */}
      <text x="192" y="13" fontSize="7" fill="var(--text-muted)">+2SD</text>
      <text x="192" y="25" fontSize="7" fill="var(--text-muted)">+1SD</text>
      <text x="192" y="41" fontSize="7" fill="var(--text-muted)">趨勢</text>
      <text x="192" y="58" fontSize="7" fill="var(--text-muted)">-1SD</text>
      <text x="192" y="73" fontSize="7" fill="var(--text-muted)">-2SD</text>
      {/* Price line */}
      <polyline points="10,70 30,65 50,55 70,45 90,40 110,35 130,32 150,28 170,25 190,20"
        stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function MonthlyVisual() {
  const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  const colors = ['#34d399', '#38bdf8', '#fbbf24'] // 0056, 00878, 00919
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.3rem', width: '100%' }}>
      {months.map((m, i) => (
        <div key={m} style={{
          background: `${colors[i % 3]}20`, border: `1px solid ${colors[i % 3]}60`,
          borderRadius: '6px', padding: '0.3rem', textAlign: 'center', fontSize: '0.65rem',
          color: colors[i % 3], fontWeight: 600,
        }}>
          <div style={{ fontSize: '0.55rem', opacity: 0.7 }}>{m}月</div>
          $
        </div>
      ))}
    </div>
  )
}

// ─── Main Landing Page ───────────────────────────────────────────────────────

export default function LandingPage({ onNavigate }: Props) {
  return (
    <div className="landing">
      {/* Hero */}
      <section className="landing-hero">
        <ChartLine />
        <h1 className="landing-title">
          Stock<span className="accent">Pilot</span> 投資策略全解析
        </h1>
        <p className="landing-subtitle">
          從定期定額到月月配息 — 用數據理解每一種投資邏輯
        </p>
        <div className="landing-source">
          資料來源：歷史回測數據整合 | 核心演算法啟動
        </div>
      </section>

      {/* Three Feature Cards */}
      <section className="landing-cards">
        <FeatureCard
          icon="?"
          question="我該什麼時候買？"
          title="回測四策略"
          description="用 20 年歷史數據，比較 DCA、單筆投入、天選之人、地獄倒霉鬼的真實報酬率"
          visual={<BacktestVisual />}
          onClick={() => onNavigate('backtest')}
        />
        <FeatureCard
          icon={'\u2696\uFE0F'}
          question="現在算貴還便宜？"
          title="樂活五線譜"
          description="對數線性迴歸 + 標準差帶，一眼判斷股價在歷史中的相對位置"
          visual={<LohasVisual />}
          onClick={() => onNavigate('lohas')}
        />
        <FeatureCard
          icon={'\u{1F4C5}'}
          question="退休現金流怎麼造？"
          title="樂退月月配"
          description="3 支高股息 ETF 配息月份互補，4 種配置策略試算你的退休被動收入"
          visual={<MonthlyVisual />}
          onClick={() => onNavigate('etf')}
        />
      </section>

      {/* Core concept */}
      <div className="landing-concept">
        <span className="landing-concept-icon">{'\u{1F4A1}'}</span>
        核心觀念：投資沒有完美時機，但有可以驗證的策略。
      </div>
    </div>
  )
}
