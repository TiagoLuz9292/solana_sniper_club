export interface Trade {
  close_ts: string;
  system: "ER" | "VW" | "S1";
  symbol: string;
  direction: "long" | "short";
  entry_type: "limit" | "market";
  fill_price: number;
  stop_loss: number;
  take_profit: number;
  tp_r: number;
  atr_at_fill: number;
  r_pct: number;
  dollar_risk: number;
  htf_multi_aligned: boolean;
  outcome: "win" | "loss" | "ambiguous";
  exit_price: number;
  candles_held: number;
  pnl_r: number;
  pnl_usd: number;
  fee_usd?: number;
  position_size_usd?: number;
  equity_after: number;
  dd_pct: number;
}

export interface EquityPoint {
  ts: string;
  equity: number;
  peak: number;
  dd_pct: number;
  dd_tier: number;
  system: string;
  symbol: string;
  direction: string;
  pnl_r: number;
  pnl_usd: number;
}

export interface ActiveTrade {
  system: string;
  symbol: string;
  direction: "long" | "short";
  fill_ts: string;
  fill_price: number;
  stop_loss: number;
  take_profit: number;
  tp_r: number;
  dollar_risk: number;
  r_pct: number;
  htf_multi_aligned: boolean;
}

export interface ActiveState {
  [key: string]: { active_trade: ActiveTrade | null };
}

export interface Portfolio {
  equity: number;
  peak: number;
  dd_tier: number;
}

export interface DashboardStats {
  currentEquity: number;
  startingEquity: number;
  totalReturnPct: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  totalTrades: number;
  openTrades: number;
}

export interface MonthlyReturn {
  month: string;
  returnPct: number;
  trades: number;
  wins: number;
}
