export interface BacktestParams {
  ticker: string;
  monthlyAmount: number;
  startYear: number;
  endYear: number;
}

export interface StrategyResult {
  label: string;
  totalInvested: number;
  finalValue: number;
  totalReturn: number;
  totalReturnPct: number;
  irr: number;
  shares: number;
}

export interface ChartPoint {
  date: string;
  dca: number;
  lucky: number;
  unlucky: number;
  lumpsum: number;
  invested: number;
}

export interface BacktestMeta {
  ticker: string;
  startDate: string;
  endDate: string;
  totalMonths: number;
  totalYears: number;
}

export interface BacktestResponse {
  strategies: {
    lumpsum: StrategyResult | null;
    dca: StrategyResult | null;
    lucky: StrategyResult | null;
    unlucky: StrategyResult | null;
  };
  chartData: ChartPoint[];
  metadata: BacktestMeta;
}

// ─── LOHAS Five Lines ─────────────────────────────────────────────────────────
export interface LohasChartPoint {
  date: string;
  close: number;
  trend: number;
  plus1s: number;
  plus2s: number;
  minus1s: number;
  minus2s: number;
}

export interface LohasLineValues {
  plus2s: number;
  plus1s: number;
  trend: number;
  minus1s: number;
  minus2s: number;
}

export interface LohasResponse {
  ticker: string;
  period: number;
  sigmaMult: number;
  currentPrice: number;
  currentDate: string;
  zone: string;
  rSquared: number;
  cv: number;
  lineValues: LohasLineValues;
  chartData: LohasChartPoint[];
}
