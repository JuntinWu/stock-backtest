import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { ETFInfo, ETFAllocation, CapitalResult, ETFCalculationResult } from '../types'

// ─── Default Data ────────────────────────────────────────────────────────────

const DEFAULT_ETFS: ETFInfo[] = [
  {
    ticker: '0056', name: '元大高股息', price: 37.82,
    quarterlyDividends: [0.55, 0.60, 0.50, 0.52],
    annualDividend: 2.17, dividendMonths: '1·4·7·10',
    emoji: '\u{1F4B0}', color: 'var(--green)',
  },
  {
    ticker: '00878', name: '國泰永續高股息', price: 22.03,
    quarterlyDividends: [0.35, 0.40, 0.35, 0.32],
    annualDividend: 1.42, dividendMonths: '2·5·8·11',
    emoji: '\u{1F331}', color: 'var(--blue)',
  },
  {
    ticker: '00919', name: '群益台灣精選高息', price: 22.50,
    quarterlyDividends: [0.55, 0.68, 0.55, 0.56],
    annualDividend: 2.34, dividendMonths: '3·6·9·12',
    emoji: '\u{1F525}', color: 'var(--amber)',
  },
]

const PRESETS = [
  { label: '2 萬/月', value: 20000 },
  { label: '3 萬/月', value: 30000 },
  { label: '4 萬/月', value: 40000 },
  { label: '5 萬/月', value: 50000 },
  { label: '10 萬/月', value: 100000 },
]

const Q_LABELS = ['Q1', 'Q2', 'Q3', 'Q4']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNum(n: number) {
  return n.toLocaleString('zh-TW', { maximumFractionDigits: 0 })
}

function formatWan(n: number) {
  if (Math.abs(n) >= 10000) return `${(n / 10000).toFixed(n >= 1000000 ? 0 : 1)} 萬`
  return formatNum(n)
}

function calcOneCapital(capital: number, etfs: ETFInfo[], targetMonthly: number): CapitalResult {
  const capitalPerETF = capital / etfs.length
  const allocations: ETFAllocation[] = etfs.map((etf) => {
    const shares = Math.floor(capitalPerETF / (etf.price * 1000))
    const totalShares = shares * 1000
    const annualDividend = totalShares * etf.annualDividend
    const monthlyDividend = annualDividend / 12
    const investedAmount = shares * etf.price * 1000
    const dividendYield = investedAmount > 0 ? (annualDividend / investedAmount) * 100 : 0
    return { ticker: etf.ticker, name: etf.name, price: etf.price, shares, totalShares, annualDividend, monthlyDividend, investedAmount, dividendYield }
  })
  const totalAnnualDividend = allocations.reduce((s, a) => s + a.annualDividend, 0)
  const totalMonthlyDividend = totalAnnualDividend / 12
  return { capital, capitalPerETF, allocations, totalAnnualDividend, totalMonthlyDividend, achieveTarget: totalMonthlyDividend >= targetMonthly }
}

function calculate(targetMonthly: number, etfs: ETFInfo[]): ETFCalculationResult {
  const step = 1000000
  const capitalResults: CapitalResult[] = []
  let reached = false
  for (let cap = step; cap <= step * 50; cap += step) {
    const cr = calcOneCapital(cap, etfs, targetMonthly)
    capitalResults.push(cr)
    if (cr.achieveTarget && !reached) {
      reached = true
      if (capitalResults.length >= 6) {
        capitalResults.push(calcOneCapital(cap + step, etfs, targetMonthly))
        break
      }
    }
    if (reached && capitalResults.length >= 6) break
  }
  return { targetMonthly, etfs, capitalResults, requiredCapital: capitalResults.find((cr) => cr.achieveTarget)?.capital ?? null }
}

// ─── Intro Section ───────────────────────────────────────────────────────────

function ETFIntro() {
  return (
    <div className="etf-intro" style={{
      background: 'var(--bg-card)', backdropFilter: 'var(--glass-blur)',
      border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
      padding: '1.5rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-card)',
    }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {'\u{1F3AF}'} 什麼是「樂退月月配」？
      </h3>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '0.75rem' }}>
        透過同時持有 <strong style={{ color: 'var(--text-primary)' }}>0056、00878、00919</strong> 三支高股息 ETF，
        利用它們<strong style={{ color: 'var(--text-primary)' }}>配息月份互補</strong>的特性（分別在 1/4/7/10、2/5/8/11、3/6/9/12 月配息），
        達到<strong style={{ color: 'var(--accent)' }}>月月都有現金流入</strong>的效果。
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '0.75rem' }}>
        輸入你的<strong style={{ color: 'var(--text-primary)' }}>目標月被動收入</strong>，本工具會自動計算不同本金下的配息金額，
        幫你回答：「要達到每月 N 萬被動收入，到底需要多少本金？」
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
        {DEFAULT_ETFS.map((etf) => (
          <span key={etf.ticker} style={{
            fontSize: '0.78rem', padding: '0.3rem 0.75rem', borderRadius: '20px', fontWeight: 600,
            background: `color-mix(in srgb, ${etf.color} 12%, transparent)`,
            color: etf.color, border: `1px solid color-mix(in srgb, ${etf.color} 40%, transparent)`,
          }}>
            {etf.emoji} {etf.ticker} — {etf.dividendMonths} 月
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Form ────────────────────────────────────────────────────────────────────

function ETFForm({ onCalculate }: { onCalculate: (r: ETFCalculationResult) => void }) {
  const [targetMonthly, setTargetMonthly] = useState(40000)
  const [etfs, setETFs] = useState<ETFInfo[]>(DEFAULT_ETFS)

  const updatePrice = (i: number, v: string) => {
    const num = parseFloat(v)
    if (isNaN(num) && v !== '') return
    setETFs((prev) => prev.map((etf, idx) => idx === i ? { ...etf, price: v === '' ? 0 : num } : etf))
  }

  const updateQ = (ei: number, qi: number, v: string) => {
    const num = parseFloat(v)
    if (isNaN(num) && v !== '') return
    setETFs((prev) => prev.map((etf, i) => {
      if (i !== ei) return etf
      const newQ = [...etf.quarterlyDividends] as [number, number, number, number]
      newQ[qi] = v === '' ? 0 : num
      return { ...etf, quarterlyDividends: newQ, annualDividend: parseFloat(newQ.reduce((s, x) => s + x, 0).toFixed(4)) }
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (targetMonthly <= 0) return
    onCalculate(calculate(targetMonthly, etfs))
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="form-title">設定參數</div>

      <div className="form-grid">
        <div className="field">
          <label>目標月被動收入（元）</label>
          <input type="number" value={targetMonthly} onChange={(e) => setTargetMonthly(Number(e.target.value))} min={1000} step={1000} />
        </div>
      </div>

      <div className="preset-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        {PRESETS.map((p) => (
          <button key={p.value} type="button"
            className={`preset-btn ${targetMonthly === p.value ? 'active' : ''}`}
            onClick={() => setTargetMonthly(p.value)}
          >{p.label}</button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="etf-config-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          <thead>
            <tr>
              <th style={{ background: 'var(--accent-glow)', padding: '0.5rem 0.6rem', textAlign: 'left', fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>ETF</th>
              <th style={{ background: 'var(--accent-glow)', padding: '0.5rem 0.6rem', textAlign: 'left', fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>股價</th>
              {Q_LABELS.map((q) => (
                <th key={q} style={{ background: 'var(--accent-glow)', padding: '0.5rem 0.6rem', textAlign: 'left', fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>{q} 配息</th>
              ))}
              <th style={{ background: 'var(--accent-glow)', padding: '0.5rem 0.6rem', textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>年配合計</th>
              <th style={{ background: 'var(--accent-glow)', padding: '0.5rem 0.6rem', textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>殖利率</th>
            </tr>
          </thead>
          <tbody>
            {etfs.map((etf, i) => (
              <tr key={etf.ticker}>
                <td style={{ padding: '0.5rem 0.6rem', fontWeight: 600, color: etf.color, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                  {etf.emoji} {etf.ticker}
                </td>
                <td style={{ padding: '0.5rem 0.6rem', borderBottom: '1px solid var(--border)' }}>
                  <input type="number" value={etf.price || ''} onChange={(e) => updatePrice(i, e.target.value)}
                    step={0.01} min={0} style={{ width: '75px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', padding: '0.35rem 0.5rem', outline: 'none' }} />
                </td>
                {etf.quarterlyDividends.map((qv, qi) => (
                  <td key={qi} style={{ padding: '0.5rem 0.4rem', borderBottom: '1px solid var(--border)' }}>
                    <input type="number" value={qv || ''} onChange={(e) => updateQ(i, qi, e.target.value)}
                      step={0.01} min={0} style={{ width: '65px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', padding: '0.35rem 0.5rem', outline: 'none' }} />
                  </td>
                ))}
                <td style={{ padding: '0.5rem 0.6rem', fontWeight: 700, color: 'var(--accent)', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                  {etf.annualDividend.toFixed(2)}
                </td>
                <td style={{ padding: '0.5rem 0.6rem', color: 'var(--green)', fontWeight: 600, textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                  {etf.price > 0 ? ((etf.annualDividend / etf.price) * 100).toFixed(2) : '0.00'}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        * 每季配息可個別修改，年配息自動加總。月份：{etfs.map((e) => `${e.ticker}(${e.dividendMonths})`).join('、')}
      </div>

      <button type="submit" className="submit-btn" style={{ width: '100%' }}>
        {'\u{1F4CA}'} 開始計算
      </button>
    </form>
  )
}

// ─── Summary Cards ───────────────────────────────────────────────────────────

function SummaryCards({ result }: { result: ETFCalculationResult }) {
  const avgYield = result.etfs.reduce((s, e) => s + (e.annualDividend / e.price) * 100, 0) / result.etfs.length
  const bestCapital = result.capitalResults.find((cr) => cr.achieveTarget)
  const maxResult = result.capitalResults[result.capitalResults.length - 1]

  const cards = [
    { emoji: '\u{1F3AF}', label: '目標月收入', value: `$${formatWan(result.targetMonthly)}`, color: 'var(--accent)' },
    { emoji: '\u{1F4B0}', label: '最低達標本金', value: bestCapital ? formatWan(bestCapital.capital) : `> ${formatWan(maxResult.capital)}`, color: bestCapital ? 'var(--green)' : 'var(--red)' },
    { emoji: '\u{1F4C8}', label: '平均殖利率', value: `${avgYield.toFixed(2)}%`, color: 'var(--green)' },
    { emoji: '\u{1F4C5}', label: '配息覆蓋', value: '12 個月', color: 'var(--purple)' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
      {cards.map((c) => (
        <div key={c.label} className="strategy-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{c.emoji}</div>
          <div className="strat-label" style={{ marginBottom: '0.3rem' }}>{c.label}</div>
          <div className="strat-irr" style={{ color: c.color }}>{c.value}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Insight Box ─────────────────────────────────────────────────────────────

function InsightBox({ result }: { result: ETFCalculationResult }) {
  const best = result.capitalResults.find((cr) => cr.achieveTarget)
  const four = result.capitalResults.find((cr) => cr.capital === 4000000)

  return (
    <div className="insight-box" style={{
      background: 'var(--amber-glow)', border: '1px solid var(--amber)',
      borderRadius: 'var(--radius-lg)', padding: '1.25rem', margin: '1.5rem 0',
      fontFamily: 'var(--font-body)', fontSize: '0.9rem', lineHeight: 1.7,
    }}>
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {'\u{1F4A1}'} 分析結論
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {best ? (
          <li style={{ padding: '0.15rem 0' }}>
            <span style={{ color: 'var(--amber)', fontWeight: 700, fontFamily: 'var(--font-mono)', marginRight: '0.5rem' }}>&gt;</span>
            要達到每月 <strong>{formatWan(result.targetMonthly)}</strong> 被動收入，最低需要 <strong>{formatWan(best.capital)}</strong> 本金
            （月配息 ${formatNum(Math.round(best.totalMonthlyDividend))}）
          </li>
        ) : (
          <li style={{ padding: '0.15rem 0' }}>
            <span style={{ color: 'var(--amber)', fontWeight: 700, fontFamily: 'var(--font-mono)', marginRight: '0.5rem' }}>&gt;</span>
            在目前試算範圍內尚無法達標，建議提高本金或選擇更高殖利率標的
          </li>
        )}
        {four && (
          <li style={{ padding: '0.15rem 0' }}>
            <span style={{ color: 'var(--amber)', fontWeight: 700, fontFamily: 'var(--font-mono)', marginRight: '0.5rem' }}>&gt;</span>
            400 萬方案：月配息 ${formatNum(Math.round(four.totalMonthlyDividend))}，
            {four.achieveTarget ? '可達標 \u2713' : `距離目標還差 $${formatNum(Math.round(result.targetMonthly - four.totalMonthlyDividend))}/月`}
          </li>
        )}
        <li style={{ padding: '0.15rem 0' }}>
          <span style={{ color: 'var(--amber)', fontWeight: 700, fontFamily: 'var(--font-mono)', marginRight: '0.5rem' }}>&gt;</span>
          三支 ETF 配息月份互補，可達成月月有現金流入
        </li>
      </ul>
    </div>
  )
}

// ─── Chart ───────────────────────────────────────────────────────────────────

function DividendChart({ result }: { result: ETFCalculationResult }) {
  const chartData = result.capitalResults.map((cr) => {
    const entry: Record<string, string | number> = { name: `${cr.capital / 10000}萬` }
    cr.allocations.forEach((a) => { entry[a.ticker] = Math.round(a.annualDividend / 12) })
    return entry
  })

  const colors = ['#34d399', '#38bdf8', '#fbbf24']

  return (
    <div className="chart-card">
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: 'var(--accent)', fontSize: '0.6rem' }}>{'\u25B6'}</span> 各本金月配息金額比較
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="name" tick={{ fill: '#7a9ab8', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
          <YAxis tick={{ fill: '#7a9ab8', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickFormatter={(v: number) => Math.abs(v) >= 10000 ? `${(v / 10000).toFixed(1)}萬` : String(v)} />
          <Tooltip contentStyle={{ background: 'rgba(26,45,69,0.95)', border: '1px solid rgba(55,90,130,0.6)', borderRadius: '8px', color: '#e0ecf5', fontSize: '0.82rem', fontFamily: 'IBM Plex Mono, monospace' }}
            formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]} />
          <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
          {result.etfs.map((etf, i) => (
            <Bar key={etf.ticker} dataKey={etf.ticker} name={`${etf.emoji} ${etf.ticker}`}
              stackId="a" fill={colors[i]} radius={i === result.etfs.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
          ))}
          <ReferenceLine y={result.targetMonthly} stroke="#f87171" strokeDasharray="8 4" strokeWidth={2}
            label={{ value: `目標 $${result.targetMonthly.toLocaleString()}/月`, fill: '#f87171', fontSize: 12, position: 'right' }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Result Tables ───────────────────────────────────────────────────────────

function ResultTables({ result }: { result: ETFCalculationResult }) {
  return (
    <>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '1.5rem 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: 'var(--accent)', fontSize: '0.6rem' }}>{'\u25B6'}</span> 各本金方案明細
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.25rem' }}>
        {result.capitalResults.map((cr) => (
          <div key={cr.capital} className="chart-card" style={{
            borderColor: cr.achieveTarget ? 'var(--green-dim)' : undefined,
            boxShadow: cr.achieveTarget ? 'var(--shadow-card), 0 0 20px var(--green-glow)' : undefined,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700 }}>
                本金 <span style={{ color: 'var(--accent)' }}>{formatWan(cr.capital)}</span>
              </div>
              <span style={{
                fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '12px', letterSpacing: '0.06em',
                ...(cr.achieveTarget
                  ? { background: 'var(--green-glow)', color: 'var(--green)', border: '1px solid var(--green-dim)' }
                  : { background: 'var(--red-glow)', color: 'var(--red)', border: '1px solid var(--red-dim)' }),
              }}>
                {cr.achieveTarget ? '\u2713 達標' : '\u2717 未達標'}
              </span>
            </div>

            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              每支 ETF 分配 {formatWan(cr.capitalPerETF)}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
              <thead>
                <tr>
                  {['ETF', '股價', '張數', '年配息', '配息月'].map((h, idx) => (
                    <th key={h} style={{ background: 'var(--accent-glow)', padding: '0.45rem 0.5rem', textAlign: idx === 0 ? 'left' : 'right', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cr.allocations.map((alloc) => {
                  const etfInfo = result.etfs.find((e) => e.ticker === alloc.ticker)
                  return (
                    <tr key={alloc.ticker}>
                      <td style={{ padding: '0.45rem 0.5rem', textAlign: 'left', fontWeight: 600, color: etfInfo?.color, borderBottom: '1px solid var(--border)' }}>
                        {etfInfo?.emoji} {alloc.ticker}
                      </td>
                      <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', borderBottom: '1px solid var(--border)', fontVariantNumeric: 'tabular-nums' }}>{alloc.price.toFixed(2)}</td>
                      <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', borderBottom: '1px solid var(--border)', fontVariantNumeric: 'tabular-nums' }}>{alloc.shares}</td>
                      <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', borderBottom: '1px solid var(--border)', fontVariantNumeric: 'tabular-nums', color: 'var(--green)' }}>{formatNum(Math.round(alloc.annualDividend))}</td>
                      <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{etfInfo?.dividendMonths}</td>
                    </tr>
                  )
                })}
                <tr>
                  <td style={{ padding: '0.55rem 0.5rem', textAlign: 'left', fontWeight: 700, borderTop: '2px solid var(--border-bright)' }}>合計</td>
                  <td style={{ borderTop: '2px solid var(--border-bright)' }}></td>
                  <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right', fontWeight: 700, borderTop: '2px solid var(--border-bright)', fontVariantNumeric: 'tabular-nums' }}>{cr.allocations.reduce((s, a) => s + a.shares, 0)}</td>
                  <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right', fontWeight: 700, borderTop: '2px solid var(--border-bright)', fontVariantNumeric: 'tabular-nums', color: 'var(--green)' }}>{formatNum(Math.round(cr.totalAnnualDividend))}</td>
                  <td style={{ borderTop: '2px solid var(--border-bright)' }}></td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>平均月配息</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: cr.achieveTarget ? 'var(--green)' : 'var(--red)' }}>
                ${formatNum(Math.round(cr.totalMonthlyDividend))} / 月
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ETFDividend() {
  const [result, setResult] = useState<ETFCalculationResult | null>(null)

  return (
    <>
      <ETFIntro />
      <ETFForm onCalculate={setResult} />
      {result && (
        <div className="results-enter">
          <SummaryCards result={result} />
          <InsightBox result={result} />
          <DividendChart result={result} />
          <ResultTables result={result} />
          <p className="disclaimer">
            {'\u26A0'} 本工具使用使用者輸入之股價與年配息金額進行試算，實際配息金額可能因除息日、
            填息情況等因素而有所不同。本工具結果僅供參考，不構成任何投資建議。
          </p>
        </div>
      )}
    </>
  )
}
