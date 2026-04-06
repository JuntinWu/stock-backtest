import { useState, useEffect, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { LohasResponse } from '../types'

const PRESETS = [
  { label: '0050.TW 3Y', ticker: '0050.TW', period: 3 },
  { label: '00878.TW 3Y', ticker: '00878.TW', period: 3 },
  { label: '00713.TW 3Y', ticker: '00713.TW', period: 3 },
  { label: 'VOO 3Y', ticker: 'VOO', period: 3 },
  { label: 'QQQ 3Y', ticker: 'QQQ', period: 3 },
]

const ZONE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  extremely_optimistic:  { label: '極度樂觀', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
  optimistic:            { label: '相對樂觀', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  fair:                  { label: '合理價位', color: '#6e8ca8', bg: 'rgba(110,140,168,0.1)' },
  pessimistic:           { label: '相對悲觀', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  extremely_pessimistic: { label: '極度悲觀', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
}

// Line colors matching reference: red/pink (optimistic), gray (trend), blue (pessimistic)
function getCloseColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--chart-close').trim() || '#e8f0f8'
}

const LINE_COLORS_BASE = {
  plus2s:  '#f43f5e',   // red — +2σ
  plus1s:  '#f4a0ab',   // pink — +1σ
  trend:   '#8b949e',   // gray — trend
  minus1s: '#79c0ff',   // light blue — -1σ
  minus2s: '#388bfd',   // blue — -2σ
  close:   '#e8f0f8',   // placeholder, overridden at render
}

const LINE_LABELS: Record<string, string> = {
  plus2s: '樂觀線 (+2σ)',
  plus1s: '相對樂觀 (+1σ)',
  trend: '趨勢線',
  minus1s: '相對悲觀 (-1σ)',
  minus2s: '悲觀線 (-2σ)',
  close: '收盤價',
}

function fmtPrice(v: number) {
  return v >= 1000 ? v.toFixed(0) : v.toFixed(2)
}

function CustomTooltip({ active, payload, label, lineColors }: any) {
  if (!active || !payload?.length) return null

  const colors = lineColors || LINE_COLORS_BASE
  const rows = [
    { key: 'close',   color: colors.close },
    { key: 'plus2s',  color: colors.plus2s },
    { key: 'plus1s',  color: colors.plus1s },
    { key: 'trend',   color: colors.trend },
    { key: 'minus1s', color: colors.minus1s },
    { key: 'minus2s', color: colors.minus2s },
  ]

  const dataMap: Record<string, number> = {}
  payload.forEach((p: any) => { dataMap[p.dataKey] = p.value })

  return (
    <div className="custom-tooltip">
      <div className="tooltip-date">{label}</div>
      {rows.map(({ key, color }) =>
        dataMap[key] !== undefined ? (
          <div className="tooltip-row" key={key}>
            <span className="tooltip-label" style={{ color }}>{LINE_LABELS[key]}</span>
            <span className="tooltip-val" style={{ color }}>{fmtPrice(dataMap[key])}</span>
          </div>
        ) : null
      )}
    </div>
  )
}

function tickFormatter(val: string) {
  return val.substring(0, 4)
}

export default function LOHASAnalysis() {
  const [ticker, setTicker] = useState('0050.TW')
  const [period, setPeriod] = useState(3)
  const [sigma, setSigma] = useState('2')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<LohasResponse | null>(null)

  // Track theme changes so close line color updates on dark/light switch
  const [closeColor, setCloseColor] = useState(() => getCloseColor())

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setCloseColor(getCloseColor())
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  }, [])

  const LINE_COLORS = useMemo(() => ({
    ...LINE_COLORS_BASE,
    close: closeColor,
  }), [closeColor])

  const applyPreset = (p: typeof PRESETS[0]) => {
    setTicker(p.ticker)
    setPeriod(p.period)
  }

  const handleSubmit = async () => {
    if (!ticker.trim()) return
    setLoading(true)
    setError(null)
    setData(null)

    try {
      const qs = new URLSearchParams({
        ticker: ticker.trim(),
        period: String(period),
        sigma,
      })
      const res = await fetch(`/api/lohas?${qs}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
      setData(json)
    } catch (err: any) {
      setError(err.message || '分析失敗')
    } finally {
      setLoading(false)
    }
  }

  const zone = data ? (ZONE_MAP[data.zone] || ZONE_MAP.fair) : null

  return (
    <div>
      {/* Form */}
      <div className="form-card">
        <div className="form-title">樂活五線譜分析</div>

        {/* Presets */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {PRESETS.map((p) => {
            const isActive = ticker === p.ticker && period === p.period
            return (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  background: isActive ? 'var(--accent-glow)' : 'transparent',
                  border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border-bright)'}`,
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius)',
                  padding: '0.35rem 0.75rem',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  fontWeight: isActive ? '600' : '400',
                  transition: 'color 0.15s, border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (isActive) return
                  e.currentTarget.style.color = 'var(--accent)'
                  e.currentTarget.style.borderColor = 'var(--accent-dim)'
                }}
                onMouseLeave={(e) => {
                  if (isActive) return
                  e.currentTarget.style.color = 'var(--text-secondary)'
                  e.currentTarget.style.borderColor = 'var(--border-bright)'
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        <div className="form-grid">
          <div className="field">
            <label>股票代號</label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="0050.TW / VOO / SPY"
            />
            <span className="field-hint">適合 ETF 或具均值回歸特性的標的</span>
          </div>
          <div className="field">
            <label>迴歸期間</label>
            <select value={period} onChange={(e) => setPeriod(Number(e.target.value))}>
              <option value={3}>3 年</option>
              <option value={5}>5 年</option>
              <option value={10}>10 年</option>
            </select>
          </div>
          <div className="field">
            <label>標準差倍數</label>
            <input
              type="number"
              value={sigma}
              onChange={(e) => setSigma(e.target.value)}
              min="0.5"
              max="3"
              step="0.5"
            />
            <span className="field-hint">外側波段的 sigma 倍數（預設 2）</span>
          </div>
        </div>

        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? '分析中...' : '▶ 執行五線譜分析'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="error-box">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-wrap">
          <div className="spinner" />
          <span>正在計算五線譜迴歸分析...</span>
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <div className="results-enter">
          {/* Meta bar */}
          <div className="meta-bar">
            <div className="meta-chip">代號 <strong>{data.ticker}</strong></div>
            <div className="meta-chip">期間 <strong>{data.period} 年</strong></div>
            <div className="meta-chip">σ 倍數 <strong>{data.sigmaMult}</strong></div>
          </div>

          {/* Signal cards */}
          <div className="lohas-signal-grid">
            <div className="lohas-signal-card">
              <div className="signal-label">目前位置</div>
              <div
                className="signal-value"
                style={{ color: zone!.color, background: zone!.bg, borderRadius: '4px', padding: '0.15rem 0.5rem', display: 'inline-block' }}
              >
                {zone!.label}
              </div>
            </div>
            <div className="lohas-signal-card">
              <div className="signal-label">收盤價</div>
              <div className="signal-value" style={{ color: 'var(--text-primary)' }}>
                ${fmtPrice(data.currentPrice)}
              </div>
              <div className="signal-hint">{data.currentDate}</div>
            </div>
            <div className="lohas-signal-card">
              <div className="signal-label">R² 決定係數</div>
              <div
                className="signal-value"
                style={{ color: data.rSquared >= 0.85 ? 'var(--green)' : data.rSquared >= 0.7 ? 'var(--amber)' : 'var(--red)' }}
              >
                {data.rSquared.toFixed(4)}
              </div>
              <div className="signal-hint">{data.rSquared >= 0.85 ? '擬合度良好' : data.rSquared >= 0.7 ? '擬合度中等' : '擬合度較低'}</div>
            </div>
            <div className="lohas-signal-card">
              <div className="signal-label">CV 變異係數</div>
              <div
                className="signal-value"
                style={{ color: data.cv < 0.05 ? 'var(--green)' : data.cv < 0.1 ? 'var(--amber)' : 'var(--red)' }}
              >
                {(data.cv * 100).toFixed(1)}%
              </div>
              <div className="signal-hint">{data.cv < 0.05 ? '波動穩定' : data.cv < 0.1 ? '波動中等' : '波動較大'}</div>
            </div>
          </div>

          {/* Five Lines Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">樂活五線譜 — {data.ticker}</div>
                <div className="chart-subtitle">
                  對數線性迴歸 ± 標準差波段｜使用調整後收盤價
                </div>
              </div>
              <div className="legend">
                {Object.entries(LINE_COLORS).map(([key, color]) => (
                  <div className="legend-item" key={key}>
                    <div
                      className="legend-dot"
                      style={{
                        background: color,
                        borderRadius: key === 'close' ? '50%' : '2px',
                        width: key === 'close' ? '8px' : '14px',
                        height: key === 'close' ? '8px' : '3px',
                      }}
                    />
                    {LINE_LABELS[key]}
                  </div>
                ))}
              </div>
            </div>

            {/* Line value tags */}
            <div className="lohas-line-values">
              {(['plus2s', 'plus1s', 'trend', 'minus1s', 'minus2s'] as const).map((k) => (
                <span
                  key={k}
                  className="lohas-line-tag"
                  style={{
                    color: LINE_COLORS[k],
                    background: `${LINE_COLORS[k]}18`,
                    border: `1px solid ${LINE_COLORS[k]}30`,
                  }}
                >
                  <span className="tag-dot" style={{ background: LINE_COLORS[k] }} />
                  {fmtPrice(data.lineValues[k])}
                </span>
              ))}
              <span
                className="lohas-line-tag"
                style={{
                  color: LINE_COLORS.close,
                  background: 'rgba(232,240,248,0.08)',
                  border: '1px solid rgba(232,240,248,0.2)',
                }}
              >
                <span className="tag-dot" style={{ background: LINE_COLORS.close, borderRadius: '50%', width: '6px', height: '6px' }} />
                {fmtPrice(data.currentPrice)}
              </span>
            </div>

            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={data.chartData} margin={{ top: 10, right: 60, left: 10, bottom: 5 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickFormatter={tickFormatter}
                  interval={Math.max(1, Math.floor(data.chartData.length / 6))}
                />
                <YAxis
                  tickFormatter={(v) => fmtPrice(v)}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  tickLine={false}
                  axisLine={false}
                  width={65}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip lineColors={LINE_COLORS} />} />

                {/* +2σ — red dashed */}
                <Line
                  type="monotone"
                  dataKey="plus2s"
                  stroke={LINE_COLORS.plus2s}
                  strokeWidth={1.5}
                  strokeDasharray="6 3"
                  dot={false}
                  activeDot={false}
                />
                {/* +1σ — pink */}
                <Line
                  type="monotone"
                  dataKey="plus1s"
                  stroke={LINE_COLORS.plus1s}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={false}
                />
                {/* Trend — gray dashed */}
                <Line
                  type="monotone"
                  dataKey="trend"
                  stroke={LINE_COLORS.trend}
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  activeDot={false}
                />
                {/* -1σ — light blue */}
                <Line
                  type="monotone"
                  dataKey="minus1s"
                  stroke={LINE_COLORS.minus1s}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={false}
                />
                {/* -2σ — blue */}
                <Line
                  type="monotone"
                  dataKey="minus2s"
                  stroke={LINE_COLORS.minus2s}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={false}
                />
                {/* Close price — white/black jagged line */}
                <Line
                  type="linear"
                  dataKey="close"
                  stroke={LINE_COLORS.close}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3, fill: LINE_COLORS.close, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Insight box */}
          <div className="lohas-insight">
            {data.zone === 'extremely_pessimistic' && (
              <>目前股價位於 <strong style={{ color: LINE_COLORS.minus2s }}>-2σ 悲觀線以下</strong>，歷史上屬於極度悲觀區域，可能是長期投資者的買入機會。</>
            )}
            {data.zone === 'pessimistic' && (
              <>目前股價位於 <strong style={{ color: LINE_COLORS.minus1s }}>-1σ 至 -2σ 之間</strong>，處於相對悲觀區域，歷史統計顯示此區間繼續下跌機率較低。</>
            )}
            {data.zone === 'fair' && (
              <>目前股價位於 <strong style={{ color: LINE_COLORS.trend }}>趨勢線附近（±1σ）</strong>，屬於合理價位區間。</>
            )}
            {data.zone === 'optimistic' && (
              <>目前股價位於 <strong style={{ color: LINE_COLORS.plus1s }}>+1σ 至 +2σ 之間</strong>，處於相對樂觀區域，需留意短期回檔風險。</>
            )}
            {data.zone === 'extremely_optimistic' && (
              <>目前股價位於 <strong style={{ color: LINE_COLORS.plus2s }}>+2σ 樂觀線以上</strong>，歷史上屬於極度樂觀區域，需注意高估風險。</>
            )}
            {' '}
            R² = {data.rSquared.toFixed(4)}，
            {data.rSquared >= 0.85
              ? '線性迴歸解釋力強，五線譜參考價值較高。'
              : data.rSquared >= 0.7
                ? '線性迴歸解釋力中等，五線譜僅供參考。'
                : '線性迴歸解釋力較弱，五線譜參考價值有限，建議搭配其他指標。'}
          </div>

          <p className="disclaimer">
            ⚠ 樂活五線譜僅為歷史統計分析工具，不構成投資建議。適合指數型 ETF 或具均值回歸特性的標的，個股可能不適用。
            使用 Yahoo Finance 調整後收盤價（含配息再投入）。
          </p>
        </div>
      )}
    </div>
  )
}
