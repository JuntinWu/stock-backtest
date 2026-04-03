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
    dca: StrategyResult | null;
    lucky: StrategyResult | null;
    unlucky: StrategyResult | null;
  };
  chartData: ChartPoint[];
  metadata: BacktestMeta;
}
