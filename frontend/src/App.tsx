import { useState, useEffect } from 'react'
import type { BacktestParams, BacktestResponse } from './types'
import BacktestForm from './components/BacktestForm'
import ResultSummary from './components/ResultSummary'
import ResultChart from './components/ResultChart'
import PriceLookup from './components/PriceLookup'
import LOHASAnalysis from './components/LOHASAnalysis'
import AdSlot from './components/AdSlot'
import Disclaimer from './components/Disclaimer'

type Tab = 'backtest' | 'lohas' | 'prices'
type Theme = 'dark' | 'light'

const VALID_TABS: Tab[] = ['backtest', 'lohas', 'prices']

function getTabFromHash(): Tab {
  const hash = window.location.hash.replace('#', '') as Tab
  return VALID_TABS.includes(hash) ? hash : 'backtest'
}

function useHashTab(): [Tab, (t: Tab) => void] {
  const [tab, setTabState] = useState<Tab>(() => getTabFromHash())

  useEffect(() => {
    const onHashChange = () => setTabState(getTabFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const setTab = (t: Tab) => {
    if (t === tab) return
    // default tab uses clean URL (no hash), others use #tabname
    if (t === 'backtest') {
      history.pushState(null, '', window.location.pathname + window.location.search)
    } else {
      history.pushState(null, '', `#${t}`)
    }
    setTabState(t)
  }

  return [tab, setTab]
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
  const [tab, setTab] = useHashTab()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BacktestResponse | null>(null)
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const { theme, toggle: toggleTheme } = useTheme()

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

      {/* Hero */}
      <section className="hero">
        <div className="hero-badges">
          <span className="hero-badge live">LIVE DATA</span>
          <span className="hero-badge source">YAHOO FINANCE</span>
        </div>
        <h1 className="hero-title">Stock<span className="accent">Pilot</span></h1>
        <p className="hero-tagline">
          用<strong>真實歷史股價</strong>驅動的投資分析工具。回測 DCA、單筆投入、天選之人等策略的長期表現，搭配<strong>樂活五線譜</strong>判斷目前股價位置，讓數據告訴你最佳投資時機。
        </p>
        <div className="hero-features">
          <span className="hero-pill"><span className="pill-icon">&#128202;</span> 四策略回測比較</span>
          <span className="hero-pill"><span className="pill-icon">&#127925;</span> 樂活五線譜分析</span>
          <span className="hero-pill"><span className="pill-icon">&#128269;</span> 歷史價格查詢</span>
          <span className="hero-pill"><span className="pill-icon">&#127470;&#127481;</span> 台股 / 美股</span>
          <span className="hero-pill"><span className="pill-icon">&#128200;</span> XIRR 年化報酬</span>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-value">20+</div>
            <div className="hero-stat-label">年回測區間</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">4</div>
            <div className="hero-stat-label">投資策略比較</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">&#127757; 全球</div>
            <div className="hero-stat-label">市場支援</div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="tab-bar-wrap">
        <div className="tab-bar">
          <button
            className={`tab-btn ${tab === 'backtest' ? 'active' : ''}`}
            onClick={() => setTab('backtest')}
          >
            <span className="tab-icon">&#128202;</span>回測分析
          </button>
          <button
            className={`tab-btn ${tab === 'lohas' ? 'active' : ''}`}
            onClick={() => setTab('lohas')}
          >
            <span className="tab-icon">&#127925;</span>樂活五線譜
            <span className="tab-badge-new">NEW</span>
          </button>
          <button
            className={`tab-btn ${tab === 'prices' ? 'active' : ''}`}
            onClick={() => setTab('prices')}
          >
            <span className="tab-icon">&#128269;</span>歷史價格查詢
          </button>
        </div>
      </div>

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

      {/* Price Lookup Tab */}
      {tab === 'prices' && <PriceLookup />}

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
