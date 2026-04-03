import { useState } from 'react'

interface Quote {
  date: string
  open: number | null
  high: number | null
  low: number | null
  close: number | null
  adjClose: number | null
  volume: number | null
}

interface PriceResponse {
  ticker: string
  count: number
  quotes: Quote[]
}

function fmtVol(v: number | null) {
  if (v == null) return '-'
  if (v >= 1e8) return `${(v / 1e8).toFixed(2)} 億`
  if (v >= 1e4) return `${(v / 1e4).toFixed(0)} 萬`
  return v.toLocaleString()
}

function fmtPrice(v: number | null) {
  return v != null ? v.toFixed(2) : '-'
}

export default function PriceLookup() {
  const [ticker, setTicker] = useState('0050.TW')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PriceResponse | null>(null)

  const handleQuery = async () => {
    if (!ticker.trim()) return alert('請輸入股票代號')
    if (!startDate || !endDate) return alert('請選擇日期區間')
    if (startDate >= endDate) return alert('開始日期必須早於結束日期')

    setLoading(true)
    setError(null)
    setData(null)

    try {
      const qs = new URLSearchParams({
        ticker: ticker.trim(),
        startDate,
        endDate,
      })
      const res = await fetch(`/api/prices?${qs}`)
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`)
      }
      setData(json)
    } catch (err: any) {
      setError(err.message || '查詢失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Query Form */}
      <div className="form-card">
        <div className="form-title">歷史價格查詢</div>
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
            <label>開始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label>結束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <button className="submit-btn" onClick={handleQuery} disabled={loading}>
          {loading ? '查詢中...' : '▶ 查詢價格'}
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
          <span>正在從 Yahoo Finance 取得歷史價格...</span>
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <div className="results-enter">
          <div className="meta-bar">
            <div className="meta-chip">代號 <strong>{data.ticker}</strong></div>
            <div className="meta-chip">共 <strong>{data.count}</strong> 筆交易日</div>
          </div>

          <div className="price-table-wrap">
            <table className="price-table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>開盤</th>
                  <th>最高</th>
                  <th>最低</th>
                  <th>收盤</th>
                  <th>調整收盤</th>
                  <th>成交量</th>
                </tr>
              </thead>
              <tbody>
                {data.quotes.map((q) => (
                  <tr key={q.date}>
                    <td className="col-date">{q.date}</td>
                    <td>{fmtPrice(q.open)}</td>
                    <td>{fmtPrice(q.high)}</td>
                    <td>{fmtPrice(q.low)}</td>
                    <td>{fmtPrice(q.close)}</td>
                    <td className="col-adj">{fmtPrice(q.adjClose)}</td>
                    <td className="col-vol">{fmtVol(q.volume)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
