type Tab = 'backtest' | 'lohas' | 'etf'
type View = 'landing' | Tab

interface Props {
  activeView: View
  onNavigate: (view: View) => void
  onToggleTheme: () => void
}

const NAV_LINKS: { key: Tab; label: string }[] = [
  { key: 'backtest', label: 'Backtesting' },
  { key: 'lohas', label: 'Valuation' },
  { key: 'etf', label: 'Dividends' },
]

export default function Nav({ activeView, onNavigate, onToggleTheme }: Props) {
  return (
    <nav className="lp-nav">
      <div className="lp-nav-inner">
        <div className="lp-nav-brand" onClick={() => onNavigate('landing')} role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('landing') }}
          style={{ cursor: 'pointer' }}>
          StockPilot
        </div>

        <div className="lp-nav-links">
          {NAV_LINKS.map((l) => (
            <button
              key={l.key}
              className={`lp-nav-link ${activeView === l.key ? 'active' : ''}`}
              onClick={() => onNavigate(l.key)}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="lp-nav-actions">
          <button className="lp-nav-login">Login</button>
          <button className="lp-nav-cta" onClick={() => onNavigate('backtest')}>Get Started</button>
          <div className="lp-nav-theme theme-toggle" onClick={onToggleTheme} title="切換明暗模式">
            <span className="toggle-label toggle-icon-sun">&#9728;&#65039;</span>
            <div className="toggle-track">
              <div className="toggle-knob" />
            </div>
            <span className="toggle-label toggle-icon-moon">&#127769;</span>
          </div>
        </div>
      </div>
    </nav>
  )
}
