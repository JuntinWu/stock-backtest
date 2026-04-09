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

// ─── ETF Dividend Calculator ─────────────────────────────────────────────────
export interface ETFInfo {
  ticker: string;
  name: string;
  price: number;
  quarterlyDividends: [number, number, number, number];
  annualDividend: number;
  dividendMonths: string;
  emoji: string;
  color: string;
}

export interface ETFAllocation {
  ticker: string;
  name: string;
  price: number;
  shares: number;
  totalShares: number;
  annualDividend: number;
  monthlyDividend: number;
  investedAmount: number;
  dividendYield: number;
}

export interface CapitalResult {
  capital: number;
  capitalPerETF: number;
  allocations: ETFAllocation[];
  totalAnnualDividend: number;
  totalMonthlyDividend: number;
  totalInvested: number;
  achieveTarget: boolean;
}

export type AllocationStrategy = 'equal' | 'max-dividend' | 'yield-weighted' | 'equal-monthly'

export interface StrategyResultData {
  capitalResults: CapitalResult[];
  requiredCapital: number | null;
}

export interface ETFCalculationResponse {
  targetMonthly: number;
  etfs: ETFInfo[];
  strategies: Record<AllocationStrategy, StrategyResultData>;
}

export interface ETFCalculationResult {
  targetMonthly: number;
  etfs: ETFInfo[];
  capitalResults: CapitalResult[];
  requiredCapital: number | null;
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
