import type { BacktestResponse } from '../types'

interface Props {
  data: BacktestResponse
}

function fmt(n: number, decimals = 0): string {
  if (n >= 1e8) return `${(n / 1e8).toFixed(2)} 億`
  if (n >= 1e4) return `${(n / 1e4).toFixed(0)} 萬`
  return n.toLocaleString()
}

function fmtPct(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
}

interface CardProps {
  variant: 'lucky' | 'dca' | 'unlucky'
  emoji: string
  tag: string
  label: string
  description: string
  irr: number
  finalValue: number
  totalInvested: number
  totalReturn: number
  totalReturnPct: number
  shares: number
}

function Card({ variant, emoji, tag, label, description, irr, finalValue, totalInvested, totalReturn, totalReturnPct, shares }: CardProps) {
  const safeIrr = Number.isFinite(irr) ? irr : 0
  const safeFinalValue = Number.isFinite(finalValue) ? finalValue : 0
  const safeTotalInvested = Number.isFinite(totalInvested) ? totalInvested : 0
  const safeTotalReturn = Number.isFinite(totalReturn) ? totalReturn : 0
  const safeTotalReturnPct = Number.isFinite(totalReturnPct) ? totalReturnPct : 0
  const safeShares = Number.isFinite(shares) ? shares : 0

  return (
    <div className={`strategy-card ${variant}`}>
      <div className="card-tag">{tag}</div>
      <div className="card-label">{emoji} {label}</div>
      <div className="card-desc">{description}</div>
      <div className="card-irr">{(safeIrr * 100).toFixed(2)}%</div>
      <div className="card-irr-label">年化報酬率 (IRR)</div>
      <div className="card-stats">
        <div className="stat">
          <span className="stat-label">最終資產</span>
          <span className="stat-value">{fmt(safeFinalValue)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">投入本金</span>
          <span className="stat-value">{fmt(safeTotalInvested)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">總報酬</span>
          <span className={`stat-value ${safeTotalReturn >= 0 ? 'positive' : 'negative'}`}>
            {fmt(safeTotalReturn)}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">報酬率</span>
          <span className={`stat-value ${safeTotalReturnPct >= 0 ? 'positive' : 'negative'}`}>
            {fmtPct(safeTotalReturnPct)}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">累積股數</span>
          <span className="stat-value">{safeShares.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

export default function ResultSummary({ data }: Props) {
  const { strategies, metadata } = data

  const empty: CardProps = {
    variant: 'dca', emoji: '', tag: '', label: '無資料', description: '',
    irr: 0, finalValue: 0, totalInvested: 0, totalReturn: 0, totalReturnPct: 0, shares: 0,
  }

  const lucky = strategies.lucky ?? empty
  const dca = strategies.dca ?? empty
  const unlucky = strategies.unlucky ?? empty

  return (
    <div>
      {/* Metadata */}
      <div className="meta-bar">
        <div className="meta-chip">代號 <strong>{metadata.ticker}</strong></div>
        <div className="meta-chip">期間 <strong>{metadata.startDate} → {metadata.endDate}</strong></div>
        <div className="meta-chip">共 <strong>{metadata.totalYears}</strong> 年 <strong>{metadata.totalMonths}</strong> 個月</div>
      </div>

      {/* Cards */}
      <div className="cards-grid">
        <Card
          variant="lucky"
          emoji="🍀"
          tag="天選之人"
          label={lucky.label}
          description="每年將 12 個月預算一次投入在該年度最低價"
          irr={lucky.irr}
          finalValue={lucky.finalValue}
          totalInvested={lucky.totalInvested}
          totalReturn={lucky.totalReturn}
          totalReturnPct={lucky.totalReturnPct}
          shares={lucky.shares}
        />
        <Card
          variant="dca"
          emoji="📅"
          tag="每月定額"
          label={dca.label}
          description="每月月初固定金額買入，不擇時進場"
          irr={dca.irr}
          finalValue={dca.finalValue}
          totalInvested={dca.totalInvested}
          totalReturn={dca.totalReturn}
          totalReturnPct={dca.totalReturnPct}
          shares={dca.shares}
        />
        <Card
          variant="unlucky"
          emoji="😱"
          tag="地獄倒霉鬼"
          label={unlucky.label}
          description="每年將 12 個月預算一次投入在該年度最高價"
          irr={unlucky.irr}
          finalValue={unlucky.finalValue}
          totalInvested={unlucky.totalInvested}
          totalReturn={unlucky.totalReturn}
          totalReturnPct={unlucky.totalReturnPct}
          shares={unlucky.shares}
        />
      </div>

      {/* Insight */}
      <div style={{
        background: 'var(--amber-glow)',
        border: '1px solid rgba(245,158,11,0.3)',
        borderRadius: 'var(--radius)',
        padding: '0.85rem 1rem',
        fontSize: '0.8rem',
        color: 'var(--amber)',
        marginBottom: '1.5rem',
        lineHeight: '1.7',
      }}>
        💡 天選之人 vs 地獄倒霉鬼：IRR 差距{' '}
        <strong>{((lucky.irr - unlucky.irr) * 100).toFixed(2)}%</strong>
        {' '}｜ DCA vs 地獄倒霉鬼：IRR 差距{' '}
        <strong>{((dca.irr - unlucky.irr) * 100).toFixed(2)}%</strong>
        {' '}→ 與其追求完美進場時機，持續投入才是關鍵。
      </div>
    </div>
  )
}
