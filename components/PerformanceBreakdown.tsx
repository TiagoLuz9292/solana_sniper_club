"use client";

import type { Trade } from "@/types";

function breakdownBy<K extends keyof Trade>(trades: Trade[], key: K) {
  const groups: Record<string, { wins: number; total: number; pnl_r: number }> = {};
  for (const t of trades) {
    const k = String(t[key]);
    if (!groups[k]) groups[k] = { wins: 0, total: 0, pnl_r: 0 };
    groups[k].total++;
    groups[k].pnl_r += t.pnl_r;
    if (t.outcome === "win") groups[k].wins++;
  }
  return Object.entries(groups).sort((a, b) => b[1].total - a[1].total);
}

function BreakdownTable({ title, rows }: { title: string; rows: [string, { wins: number; total: number; pnl_r: number }][] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-300 mb-3">{title}</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-500 text-xs uppercase border-b border-surface-border">
            <th className="text-left pb-1">{title}</th>
            <th className="text-right pb-1">Trades</th>
            <th className="text-right pb-1">Win %</th>
            <th className="text-right pb-1">Avg R</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, { wins, total, pnl_r }]) => {
            const wr   = total > 0 ? (wins / total) * 100 : 0;
            const avgR = total > 0 ? pnl_r / total : 0;
            return (
              <tr key={label} className="border-b border-surface-border/40 last:border-0">
                <td className="py-1.5 font-mono text-xs text-slate-300">{label.replace("USDT", "")}</td>
                <td className="py-1.5 text-right text-slate-400">{total}</td>
                <td className={`py-1.5 text-right font-semibold ${wr >= 50 ? "text-emerald-400" : "text-red-400"}`}>
                  {wr.toFixed(0)}%
                </td>
                <td className={`py-1.5 text-right font-semibold tabular-nums ${avgR >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {avgR >= 0 ? "+" : ""}{avgR.toFixed(2)}R
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function PerformanceBreakdown({ trades }: { trades: Trade[] }) {
  const bySymbol    = breakdownBy(trades, "symbol");
  const bySystem    = breakdownBy(trades, "system");
  const byDirection = breakdownBy(trades, "direction");

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-5">Performance Breakdown</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <BreakdownTable title="Symbol"    rows={bySymbol} />
        <BreakdownTable title="System"    rows={bySystem} />
        <BreakdownTable title="Direction" rows={byDirection} />
      </div>
    </div>
  );
}
