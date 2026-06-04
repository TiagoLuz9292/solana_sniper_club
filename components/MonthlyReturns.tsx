"use client";

import type { MonthlyReturn } from "@/types";

export default function MonthlyReturns({ data }: { data: MonthlyReturn[] }) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Monthly Returns</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs uppercase border-b border-surface-border">
              <th className="text-left pb-2">Month</th>
              <th className="text-right pb-2">Return</th>
              <th className="text-right pb-2">Trades</th>
              <th className="text-right pb-2">Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().map(row => {
              const isPos = row.returnPct >= 0;
              const wr    = row.trades > 0 ? (row.wins / row.trades) * 100 : 0;
              return (
                <tr key={row.month} className="border-b border-surface-border/50 last:border-0">
                  <td className="py-2 text-slate-300">
                    {new Date(row.month + "-02").toLocaleString("default", { month: "long", year: "numeric" })}
                  </td>
                  <td className={`py-2 text-right font-semibold tabular-nums ${isPos ? "text-emerald-400" : "text-red-400"}`}>
                    {isPos ? "+" : ""}{row.returnPct.toFixed(1)}%
                  </td>
                  <td className="py-2 text-right text-slate-300">{row.trades}</td>
                  <td className="py-2 text-right text-slate-300">{wr.toFixed(0)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
