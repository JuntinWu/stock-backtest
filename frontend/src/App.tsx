import { useState, useEffect } from 'react'
import type { BacktestParams, BacktestResponse } from './types'
import BacktestForm from './components/BacktestForm'
import ResultSummary from './components/ResultSummary'
import ResultChart from './components/ResultChart'
import LOHASAnalysis from './components/LOHASAnalysis'
import ETFDividend from './components/ETFDividend'
import LandingPage from './components/LandingPage'
import Nav from './components/Nav'
import AdSlot from './components/AdSlot'
import Disclaimer from './components/Disclaimer'
import PrivacyPolicy from './components/PrivacyPolicy'

const TERMS_ACK_KEY = 'stockpilot_terms_accepted_v1'

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
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [forceAcknowledge, setForceAcknowledge] = useState(false)
  const { theme, toggle: toggleTheme } = useTheme()

  // First-visit: force disclaimer acknowledgment
  useEffect(() => {
    try {
      const accepted = localStorage.getItem(TERMS_ACK_KEY)
      if (!accepted) {
        setForceAcknowledge(true)
        setDisclaimerOpen(true)
      }
    } catch {
      // localStorage unavailable (SSR/privacy mode): skip enforcement
    }
  }, [])

  const handleDisclaimerClose = () => {
    if (forceAcknowledge) {
      try {
        localStorage.setItem(TERMS_ACK_KEY, new Date().toISOString())
      } catch {
        // ignore
      }
      setForceAcknowledge(false)
    }
    setDisclaimerOpen(false)
  }

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
    <>
      {/* Shared Nav (full-width, outside .app container) */}
      <Nav activeView={view} onNavigate={setView} onToggleTheme={toggleTheme} />

    <div className="app">
      {/* Landing Page */}
      {isLanding && <LandingPage onNavigate={(t) => setView(t)} />}

      {/* Backtest Tab */}
      {tab === 'backtest' && (
        <>
          <div className="etf-intro" style={{
            background: 'var(--bg-card)', backdropFilter: 'var(--glass-blur)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
            padding: '1.5rem', marginTop: '1.5rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-card)',
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              &#128202; 什麼是「回測四策略」？
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '0.75rem' }}>
              用 <strong style={{ color: 'var(--text-primary)' }}>Yahoo Finance 真實歷史股價</strong>，模擬四種不同投入時機的策略，
              計算 <strong style={{ color: 'var(--text-primary)' }}>XIRR 年化報酬率</strong>，
              回答一個核心問題：<strong style={{ color: 'var(--accent)' }}>「擇時」到底值不值得？</strong>
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '0.75rem' }}>
              結論往往讓人意外 — 即使每年買在最高點的「地獄倒霉鬼」，長期下來仍然是正報酬。
              <strong style={{ color: 'var(--text-primary)' }}>買什麼比什麼時候買重要得多。</strong>
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {[
                { emoji: '⚡', label: '單筆投入', desc: '第一天 All-in', color: 'var(--amber)' },
                { emoji: '👑', label: '天選之人', desc: '年度最低點', color: 'var(--green)' },
                { emoji: '📅', label: '每月定額 DCA', desc: '不擇時', color: 'var(--blue)' },
                { emoji: '💔', label: '地獄倒霉鬼', desc: '年度最高點', color: 'var(--red)' },
              ].map((s) => (
                <span key={s.label} style={{
                  fontSize: '0.78rem', padding: '0.3rem 0.75rem', borderRadius: '20px', fontWeight: 600,
                  background: `color-mix(in srgb, ${s.color} 12%, transparent)`,
                  color: s.color, border: `1px solid color-mix(in srgb, ${s.color} 40%, transparent)`,
                }}>
                  {s.emoji} {s.label} — {s.desc}
                </span>
              ))}
            </div>
          </div>
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
      {tab === 'lohas' && (
        <>
          <div className="etf-intro" style={{
            background: 'var(--bg-card)', backdropFilter: 'var(--glass-blur)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
            padding: '1.5rem', marginTop: '1.5rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-card)',
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              &#127925; 什麼是「樂活五線譜」？
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '0.75rem' }}>
              對歷史收盤價做 <strong style={{ color: 'var(--text-primary)' }}>對數線性迴歸</strong>，
              畫出趨勢線及上下各 1、2 個標準差的五條參考線。
              核心假設是 <strong style={{ color: 'var(--accent)' }}>均值回歸</strong> —
              股價長期沿著趨勢線波動，偏離太多終會回歸。
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '0.75rem' }}>
              適合 <strong style={{ color: 'var(--text-primary)' }}>ETF 或具均值回歸特性的標的</strong>（如 0050.TW、VOO）。
              搭配 R² 決定係數判斷擬合度、CV 變異係數判斷穩定性。
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {[
                { label: '極度樂觀 +2σ', desc: '歷史偏貴', color: '#f43f5e' },
                { label: '相對樂觀 +1σ', desc: '稍微偏高', color: '#f59e0b' },
                { label: '趨勢線', desc: '長期均值', color: '#8b949e' },
                { label: '相對悲觀 -1σ', desc: '稍微偏低', color: '#38bdf8' },
                { label: '極度悲觀 -2σ', desc: '歷史偏便宜', color: '#a78bfa' },
              ].map((s) => (
                <span key={s.label} style={{
                  fontSize: '0.78rem', padding: '0.3rem 0.75rem', borderRadius: '20px', fontWeight: 600,
                  background: `${s.color}18`,
                  color: s.color, border: `1px solid ${s.color}50`,
                }}>
                  {s.label}
                </span>
              ))}
            </div>
          </div>
          <LOHASAnalysis />
        </>
      )}

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
          <button className="footer-link" onClick={() => setPrivacyOpen(true)}>
            隱私權政策
          </button>
          <span className="footer-sep">·</span>
          <a className="footer-link" href="mailto:contact@stockpilot.example">聯絡我們</a>
        </div>
        <div className="footer-copy">
          &#169; 2026 StockPilot — 教育與研究用途的歷史資料分析工具 · 本站內容僅供參考，不構成投資建議
        </div>
      </footer>

      <Disclaimer
        open={disclaimerOpen}
        onClose={handleDisclaimerClose}
        mustAcknowledge={forceAcknowledge}
      />
      <PrivacyPolicy open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </div>
    </>
  )
}
