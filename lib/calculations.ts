import type { Trade, EquityPoint, DashboardStats, MonthlyReturn } from "@/types";

const TAKER = 0.00055; // 0.055% Bybit demo taker
const MAKER = 0.0002;  // 0.020% Bybit demo maker

export function computeEstimatedFees(trades: Trade[]): number {
  return trades.reduce((total, t) => {
    const qty = t.dollar_risk / Math.abs(t.fill_price - t.stop_loss);
    const entryFee = qty * t.fill_price  * (t.entry_type === "limit" ? MAKER : TAKER);
    const exitFee  = qty * t.exit_price  * (t.outcome   === "win"    ? MAKER : TAKER);
    return total + entryFee + exitFee;
  }, 0);
}

const STARTING_EQUITY = 300;

export function computeStats(
  trades: Trade[],
  equity: EquityPoint[],
  currentEquity: number,
  startingEquity = STARTING_EQUITY,
): DashboardStats {
  const closed = trades;
  const wins   = closed.filter(t => t.outcome === "win");
  const losses = closed.filter(t => t.outcome === "loss");

  const grossWin  = wins.reduce((s, t)   => s + (t.pnl_usd ?? 0), 0);
  const grossLoss = losses.reduce((s, t) => s + Math.abs(t.pnl_usd ?? 0), 0);

  // Compute max drawdown purely from realized equity curve, anchored to startingEquity.
  // The bot's dd_pct field reflects unrealized PnL during open trades and is unreliable.
  let seriesPeak = startingEquity;
  const maxDD = equity.reduce((m, e) => {
    if (e.equity > seriesPeak) seriesPeak = e.equity;
    return seriesPeak > 0 ? Math.max(m, (seriesPeak - e.equity) / seriesPeak * 100) : m;
  }, 0);

  return {
    currentEquity,
    startingEquity,
    totalReturnPct:  ((currentEquity - startingEquity) / startingEquity) * 100,
    winRate:         closed.length > 0 ? (wins.length / closed.length) * 100 : 0,
    profitFactor:    grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0,
    maxDrawdown:     maxDD,
    totalTrades:     closed.length,
    openTrades:      0,
  };
}

export function computeMonthlyReturns(equity: EquityPoint[]): MonthlyReturn[] {
  const byMonth: Record<string, { start: number; end: number; trades: number; wins: number }> = {};

  for (const pt of equity) {
    const month = pt.ts.slice(0, 7); // "YYYY-MM"
    if (!byMonth[month]) {
      byMonth[month] = { start: pt.equity - pt.pnl_usd, end: pt.equity, trades: 1, wins: pt.pnl_r > 0 ? 1 : 0 };
    } else {
      byMonth[month].end = pt.equity;
      byMonth[month].trades++;
      if (pt.pnl_r > 0) byMonth[month].wins++;
    }
  }

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { start, end, trades, wins }]) => ({
      month,
      returnPct: start > 0 ? ((end - start) / start) * 100 : 0,
      trades,
      wins,
    }));
}
