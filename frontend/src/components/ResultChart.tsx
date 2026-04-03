import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ChartPoint } from '../types'

interface Props {
  data: ChartPoint[]
  ticker: string
}

function formatY(value: number): string {
  if (value >= 1e8) return `${(value / 1e8).toFixed(1)}億`
  if (value >= 1e4) return `${(value / 1e4).toFixed(0)}萬`
  return String(value)
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const rows = [
    { key: 'lucky',   label: '🍀 天選之人',     color: 'var(--green)' },
    { key: 'dca',     label: '📅 不擇時進場 DCA', color: 'var(--blue)' },
    { key: 'unlucky', label: '😱 地獄倒霉鬼',   color: 'var(--red)' },
    { key: 'invested', label: '💰 投入本金',    color: 'var(--text-muted)' },
  ]

  const dataMap: Record<string, number> = {}
  payload.forEach((p: any) => { dataMap[p.dataKey] = p.value })

  return (
    <div className="custom-tooltip">
      <div className="tooltip-date">{label}</div>
      {rows.map(({ key, label: l, color }) =>
        dataMap[key] !== undefined ? (
          <div className="tooltip-row" key={key}>
            <span className="tooltip-label" style={{ color }}>{l}</span>
            <span className="tooltip-val" style={{ color }}>{formatY(dataMap[key])}</span>
          </div>
        ) : null
      )}
    </div>
  )
}

// Sample x-axis labels to avoid crowding
function tickFormatter(val: string) {
  if (val.endsWith('-01') || val.endsWith('-06')) return val.split('-')[0]
  return ''
}

export default function ResultChart({ data, ticker }: Props) {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">投資組合價值走勢 — {ticker}</div>
          <div className="chart-subtitle">使用調整後收盤價（含配息股息再投入）</div>
        </div>
        <div className="legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'var(--green)' }} />
            天選之人
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'var(--blue)' }} />
            不擇時進場 DCA
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'var(--red)' }} />
            地獄倒霉鬼
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'var(--text-muted)', borderRadius: '2px' }} />
            投入本金
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
            tickFormatter={(v) => v.split('-')[0]}
            interval={11}
          />
          <YAxis
            tickFormatter={formatY}
            tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Invested capital reference */}
          <Line
            type="monotone"
            dataKey="invested"
            stroke="rgba(110, 140, 168, 0.35)"
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={false}
            activeDot={false}
          />

          {/* Unlucky */}
          <Line
            type="monotone"
            dataKey="unlucky"
            stroke="var(--red)"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 4, fill: 'var(--red)', strokeWidth: 0 }}
          />

          {/* DCA */}
          <Line
            type="monotone"
            dataKey="dca"
            stroke="var(--blue)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'var(--blue)', strokeWidth: 0 }}
          />

          {/* Lucky */}
          <Line
            type="monotone"
            dataKey="lucky"
            stroke="var(--green)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'var(--green)', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
