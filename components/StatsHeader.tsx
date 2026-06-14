"use client";

import { useEffect, useState } from "react";
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

export default function StatsHeader({
  stats,
  activeApiPath = "/api/active",
  marketStateApiPath = "/api/market-state",
}: {
  stats: DashboardStats;
  activeApiPath?: string;
  marketStateApiPath?: string;
}) {
  const [openTrades, setOpenTrades] = useState(stats.openTrades);
  const [liveEquity, setLiveEquity] = useState(stats.currentEquity);

  useEffect(() => {
    async function poll() {
      const [activeRes, marketRes] = await Promise.all([
        fetch(activeApiPath).then((r) => r.json()).catch(() => null),
        fetch(marketStateApiPath).then((r) => r.json()).catch(() => null),
      ]);
      if (activeRes && !activeRes.error) {
        const count = Object.values(activeRes).filter(
          (v) => !!(v as { active_trade?: unknown }).active_trade
        ).length;
        setOpenTrades(count);
      }
      if (marketRes && !marketRes.error && typeof marketRes.equity === "number") {
        setLiveEquity(marketRes.equity);
      }
    }
    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, []);

  const startEq = stats.startingEquity || 300;
  const totalReturnPct = ((liveEquity - startEq) / startEq) * 100;
  const returnColor = totalReturnPct >= 0 ? "text-emerald-400" : "text-red-400";
  const returnSign  = totalReturnPct >= 0 ? "+" : "";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 p-6 bg-surface-card border border-surface-border rounded-xl">
      <Stat
        label="Total Return"
        value={isFinite(totalReturnPct) ? `${returnSign}${totalReturnPct.toFixed(1)}%` : "—"}
        sub={`$${startEq} → $${liveEquity.toFixed(0)}`}
        color={returnColor}
      />
      <Stat
        label="Equity"
        value={`$${liveEquity.toFixed(2)}`}
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
        value={`-${(stats.maxDrawdown ?? 0).toFixed(1)}%`}
        color="text-amber-400"
      />
      <Stat
        label="Open Trades"
        value={String(openTrades)}
        color={openTrades > 0 ? "text-brand-light" : "text-slate-400"}
      />
    </div>
  );
}
