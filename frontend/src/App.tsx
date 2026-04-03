import { useState } from 'react'
import type { BacktestParams, BacktestResponse } from './types'
import BacktestForm from './components/BacktestForm'
import ResultSummary from './components/ResultSummary'
import ResultChart from './components/ResultChart'
import PriceLookup from './components/PriceLookup'

type Tab = 'backtest' | 'prices'

export default function App() {
  const [tab, setTab] = useState<Tab>('backtest')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BacktestResponse | null>(null)

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
      {/* Header */}
      <header className="header">
        <div className="header-top">
          <span className="header-badge">LIVE DATA</span>
        </div>
        <h1>股票 <span>回測</span> 系統</h1>
        <p className="header-sub">
          天選之人 vs DCA vs 地獄倒霉鬼 ｜ 真實 Yahoo Finance 資料 ｜ XIRR 年化報酬計算
        </p>
      </header>

      {/* Tabs */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${tab === 'backtest' ? 'active' : ''}`}
          onClick={() => setTab('backtest')}
        >
          回測分析
        </button>
        <button
          className={`tab-btn ${tab === 'prices' ? 'active' : ''}`}
          onClick={() => setTab('prices')}
        >
          歷史價格查詢
        </button>
      </div>

      {/* Backtest Tab */}
      {tab === 'backtest' && (
        <>
          <BacktestForm onSubmit={handleSubmit} loading={loading} />

          {error && (
            <div className="error-box">
              <span>⚠</span>
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

              <p className="disclaimer">
                ⚠ 本工具資料來源為 Yahoo Finance，使用調整後收盤價（adjClose）計算，
                已反映股息再投入及股票分割。回測結果僅供參考，過去績效不代表未來表現，
                不構成任何投資建議。所有投資皆有風險，請自行評估。
              </p>
            </div>
          )}
        </>
      )}

      {/* Price Lookup Tab */}
      {tab === 'prices' && <PriceLookup />}
    </div>
  )
}
