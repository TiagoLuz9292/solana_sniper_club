"use client";

import type { DashboardStats } from "@/types";

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
      <span className={`text-2xl font-bold tabular-nums ${color ?? "text-white"}`}>{value}</span>
      {sub && <span className="text-xs text-slate-500">{sub}</span>}
    </div>
  );
}

export default function StatsHeader({ stats }: { stats: DashboardStats }) {
  const returnColor = stats.totalReturnPct >= 0 ? "text-emerald-400" : "text-red-400";
  const returnSign  = stats.totalReturnPct >= 0 ? "+" : "";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 p-6 bg-surface-card border border-surface-border rounded-xl">
      <Stat
        label="Total Return"
        value={`${returnSign}${stats.totalReturnPct.toFixed(1)}%`}
        sub={`$${stats.startingEquity} → $${stats.currentEquity.toFixed(0)}`}
        color={returnColor}
      />
      <Stat
        label="Equity"
        value={`$${stats.currentEquity.toFixed(2)}`}
      />
      <Stat
        label="Win Rate"
        value={`${stats.winRate.toFixed(1)}%`}
        sub={`${stats.totalTrades} closed trades`}
      />
      <Stat
        label="Profit Factor"
        value={isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : "∞"}
      />
      <Stat
        label="Max Drawdown"
        value={`-${stats.maxDrawdown.toFixed(1)}%`}
        color="text-amber-400"
      />
      <Stat
        label="Open Trades"
        value={String(stats.openTrades)}
        color={stats.openTrades > 0 ? "text-brand-light" : "text-slate-400"}
      />
    </div>
  );
}
