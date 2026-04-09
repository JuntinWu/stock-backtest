import { useState, useEffect } from 'react'
import type { BacktestParams, BacktestResponse } from './types'
import BacktestForm from './components/BacktestForm'
import ResultSummary from './components/ResultSummary'
import ResultChart from './components/ResultChart'
import LOHASAnalysis from './components/LOHASAnalysis'
import ETFDividend from './components/ETFDividend'
import LandingPage from './components/LandingPage'
import AdSlot from './components/AdSlot'
import Disclaimer from './components/Disclaimer'

type Tab = 'backtest' | 'lohas'  | 'etf'
type View = 'landing' | Tab
type Theme = 'dark' | 'light'

const VALID_TABS: Tab[] = ['backtest', 'lohas', 'etf']

function getViewFromHash(): View {
  const hash = window.location.hash.replace('#', '')
  if (VALID_TABS.includes(hash as Tab)) return hash as Tab
  return 'landing'
}

function useHashNav(): [View, (v: View) => void] {
  const [view, setViewState] = useState<View>(() => getViewFromHash())

  useEffect(() => {
    const onHashChange = () => setViewState(getViewFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const setView = (v: View) => {
    if (v === view) return
    if (v === 'landing') {
      history.pushState(null, '', window.location.pathname + window.location.search)
    } else {
      history.pushState(null, '', `#${v}`)
    }
    setViewState(v)
    window.scrollTo({ top: 0 })
  }

  return [view, setView]
}

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (document.documentElement.getAttribute('data-theme') as Theme) || 'dark'
  })
  const [userOverride, setUserOverride] = useState<boolean>(() => {
    const stored = localStorage.getItem('theme')
    return stored === 'light' || stored === 'dark'
  })

  // Apply theme to DOM; only persist when user has explicitly overridden
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    if (userOverride) {
      localStorage.setItem('theme', theme)
    }
  }, [theme, userOverride])

  // Follow system preference changes unless user has overridden
  useEffect(() => {
    if (userOverride) return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = (e: MediaQueryListEvent) => setTheme(e.matches ? 'light' : 'dark')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [userOverride])

  const toggle = () => {
    setUserOverride(true)
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }
  return { theme, toggle }
}

export default function App() {
  const [view, setView] = useHashNav()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BacktestResponse | null>(null)
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const { theme, toggle: toggleTheme } = useTheme()

  const isLanding = view === 'landing'
  const tab = isLanding ? null : view

  const handleSubmit = async (params: BacktestParams) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const qs = new URLSearchParams({
        ticker: params.ticker,
        monthlyAmount: String(params.monthlyAmount),
        startYear: String(params.startYear),
        endYear: String(params.endYear),
      })

      const res = await fetch(`/api/backtest?${qs}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || '回測失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      {/* Theme Toggle */}
      <div className="theme-toggle" onClick={toggleTheme} title="切換明暗模式">
        <span className="toggle-label toggle-icon-sun">&#9728;&#65039;</span>
        <div className="toggle-track">
          <div className="toggle-knob" />
        </div>
        <span className="toggle-label toggle-icon-moon">&#127769;</span>
      </div>

      {/* Landing Page */}
      {isLanding && <LandingPage onNavigate={(t) => setView(t)} />}

      {/* Inner Pages */}
      {!isLanding && (
        <>
          {/* Compact Header */}
          <div className="inner-header">
            <button className="back-btn" onClick={() => setView('landing')}>
              &larr; <span className="back-brand">Stock<span className="accent">Pilot</span></span>
            </button>
          </div>

          {/* Tabs */}
          <div className="tab-bar-wrap">
            <div className="tab-bar">
              <button
                className={`tab-btn ${tab === 'backtest' ? 'active' : ''}`}
                onClick={() => setView('backtest')}
              >
                <span className="tab-icon">&#128202;</span>回測分析
              </button>
              <button
                className={`tab-btn ${tab === 'lohas' ? 'active' : ''}`}
                onClick={() => setView('lohas')}
              >
                <span className="tab-icon">&#127925;</span>樂活五線譜
              </button>
              <button
                className={`tab-btn ${tab === 'etf' ? 'active' : ''}`}
                onClick={() => setView('etf')}
              >
                <span className="tab-icon">&#128176;</span>樂退月月配
                <span className="tab-badge-new">NEW</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Backtest Tab */}
      {tab === 'backtest' && (
        <>
          <BacktestForm onSubmit={handleSubmit} loading={loading} />

          {error && (
            <div className="error-box">
              <span>&#9888;</span>
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div className="loading-wrap">
              <div className="spinner" />
              <span>正在從 Yahoo Finance 撈取歷史資料並計算回測...</span>
            </div>
          )}

          {result && !loading && (
            <div className="results-enter">
              <ResultSummary data={result} />
              <ResultChart data={result.chartData} ticker={result.metadata.ticker} />

              {/* In-content Ad Slot (after results) */}
              <AdSlot slot="2222222222" format="fluid" layout="in-article" className="ad-slot-inline" />

              <p className="disclaimer">
                &#9888; 本工具資料來源為 Yahoo Finance，使用調整後收盤價（adjClose）計算，
                已反映股息再投入及股票分割。回測結果僅供參考，過去績效不代表未來表現，
                不構成任何投資建議。所有投資皆有風險，請自行評估。
              </p>
            </div>
          )}
        </>
      )}

      {/* LOHAS Five Lines Tab */}
      {tab === 'lohas' && <LOHASAnalysis />}

      {/* ETF Dividend Tab */}
      {tab === 'etf' && <ETFDividend />}

      {/* Bottom Ad Slot (above footer) */}
      <AdSlot slot="1111111111" format="horizontal" className="ad-slot-bottom" />

      {/* Footer */}
      <footer className="footer">
        <div className="footer-brand">Stock<span>Pilot</span></div>
        <div className="footer-links">
          <button className="footer-link" onClick={() => setDisclaimerOpen(true)}>
            免責聲明
          </button>
          <span className="footer-sep">·</span>
          <a className="footer-link" href="mailto:contact@stockpilot.example">聯絡我們</a>
        </div>
        <div className="footer-copy">
          &#169; 2026 StockPilot — 真實數據驅動的投資分析工具 · 本站內容僅供參考，不構成投資建議
        </div>
      </footer>

      <Disclaimer open={disclaimerOpen} onClose={() => setDisclaimerOpen(false)} />
    </div>
  )
}
