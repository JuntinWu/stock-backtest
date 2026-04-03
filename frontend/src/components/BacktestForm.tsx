import { useState } from 'react'
import type { BacktestParams } from '../types'

interface Props {
  onSubmit: (params: BacktestParams) => void
  loading: boolean
}

const currentYear = new Date().getFullYear()

const PRESETS = [
  { label: '2330 2006→', ticker: '2330.TW', monthly: 10000, start: 2006, end: currentYear },
  { label: '0050 2003→', ticker: '0050.TW', monthly: 10000, start: 2003, end: currentYear },
  { label: 'VOO 2000→', ticker: 'VOO', monthly: 10000, start: 2000, end: currentYear },
  { label: 'QQQ 2000→', ticker: 'QQQ', monthly: 10000, start: 2000, end: currentYear },
]

export default function BacktestForm({ onSubmit, loading }: Props) {
  const [ticker, setTicker] = useState('0050.TW')
  const [monthlyAmount, setMonthlyAmount] = useState('10000')
  const [startYear, setStartYear] = useState('2003')
  const [endYear, setEndYear] = useState(String(currentYear))

  const handleSubmit = () => {
    const params: BacktestParams = {
      ticker: ticker.trim(),
      monthlyAmount: parseFloat(monthlyAmount),
      startYear: parseInt(startYear, 10),
      endYear: parseInt(endYear, 10),
    }
    if (!params.ticker) return alert('請輸入股票代號')
    if (isNaN(params.monthlyAmount) || params.monthlyAmount <= 0) return alert('請輸入有效的每月投資金額')
    if (params.startYear >= params.endYear) return alert('開始年份必須小於結束年份')
    onSubmit(params)
  }

  const applyPreset = (p: typeof PRESETS[0]) => {
    setTicker(p.ticker)
    setMonthlyAmount(String(p.monthly))
    setStartYear(String(p.start))
    setEndYear(String(p.end))
  }

  return (
    <div className="form-card">
      <div className="form-title">回測參數設定</div>

      {/* Presets */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              background: 'transparent',
              border: '1px solid var(--border-bright)',
              color: 'var(--text-secondary)',
              padding: '0.3rem 0.7rem',
              borderRadius: '4px',
              cursor: 'pointer',
              letterSpacing: '0.04em',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--green)'
              e.currentTarget.style.borderColor = 'var(--green-dim)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)'
              e.currentTarget.style.borderColor = 'var(--border-bright)'
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="form-grid">
        <div className="field">
          <label>股票代號</label>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="0050.TW / VOO / AAPL"
          />
          <span className="field-hint">台股加 .TW，美股直接輸入代號</span>
        </div>

        <div className="field">
          <label>每月定投金額</label>
          <input
            type="number"
            value={monthlyAmount}
            onChange={(e) => setMonthlyAmount(e.target.value)}
            placeholder="10000"
            min="1"
          />
          <span className="field-hint">年化 = 此金額 × 12</span>
        </div>

        <div className="field">
          <label>開始年份</label>
          <input
            type="number"
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
            placeholder="2003"
            min="1990"
            max={currentYear - 1}
          />
        </div>

        <div className="field">
          <label>結束年份</label>
          <input
            type="number"
            value={endYear}
            onChange={(e) => setEndYear(e.target.value)}
            placeholder={String(currentYear)}
            min="1991"
            max={currentYear}
          />
        </div>
      </div>

      <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? '回測中...' : '▶ 執行回測'}
      </button>
    </div>
  )
}
