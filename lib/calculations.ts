import type { Trade, EquityPoint, DashboardStats, MonthlyReturn } from "@/types";

const STARTING_EQUITY = 300;

export function computeStats(trades: Trade[], equity: EquityPoint[], currentEquity: number): DashboardStats {
  const closed = trades;
  const wins   = closed.filter(t => t.outcome === "win");
  const losses = closed.filter(t => t.outcome === "loss");

  const grossWin  = wins.reduce((s, t)   => s + t.pnl_usd, 0);
  const grossLoss = losses.reduce((s, t) => s + Math.abs(t.pnl_usd), 0);

  const maxDD = equity.reduce((m, e) => Math.max(m, e.dd_pct), 0);

  return {
    currentEquity,
    startingEquity:  STARTING_EQUITY,
    totalReturnPct:  ((currentEquity - STARTING_EQUITY) / STARTING_EQUITY) * 100,
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
