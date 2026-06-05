"use client";

import { useEffect, useState } from "react";
import type { ActiveState, ActiveTrade } from "@/types";

const BYBIT_PUBLIC = "https://api-demo.bybit.com/v5/market/tickers?category=linear&symbol=";

function DirectionBadge({ dir }: { dir: string }) {
  const isLong = dir === "long";
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${isLong ? "bg-emerald-900 text-emerald-300" : "bg-red-900 text-red-300"}`}>
      {isLong ? "▲ LONG" : "▼ SHORT"}
    </span>
  );
}

function calcPnl(t: ActiveTrade, currentPrice: number): number {
  const qty = t.dollar_risk / Math.abs(t.fill_price - t.stop_loss);
  const mult = t.direction === "long" ? 1 : -1;
  return qty * (currentPrice - t.fill_price) * mult;
}

async function fetchTicker(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(BYBIT_PUBLIC + symbol, { cache: "no-store" });
    const data = await res.json();
    const price = data?.result?.list?.[0]?.lastPrice;
    return price ? parseFloat(price) : null;
  } catch {
    return null;
  }
}

export default function LiveStatus() {
  const [active, setActive] = useState<ActiveState | null>(null);
  const [pnlMap, setPnlMap] = useState<Record<string, number>>({});
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  async function refresh() {
    const activeRes = await fetch("/api/active").then(r => r.json()).catch(() => null);
    if (activeRes && !activeRes.error) setActive(activeRes);

    const trades = Object.entries(activeRes ?? {})
      .filter(([, v]: [string, unknown]) => (v as { active_trade: ActiveTrade | null }).active_trade !== null)
      .map(([, v]) => (v as { active_trade: ActiveTrade }).active_trade);

    const newPnl: Record<string, number> = {};
    await Promise.all(trades.map(async (t) => {
      const price = await fetchTicker(t.symbol);
      if (price !== null) newPnl[t.symbol] = calcPnl(t, price);
    }));
    setPnlMap(newPnl);
    setLastUpdate(new Date());
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, []);

  const openTrades = Object.entries(active ?? {}).filter(([, v]) => v.active_trade !== null);

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Live Positions</h2>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${openTrades.length > 0 ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
          <span className="text-xs text-slate-400">
            {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : "Loading..."}
          </span>
        </div>
      </div>

      {openTrades.length === 0 ? (
        <p className="text-slate-500 text-sm">No active positions — scanning market...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-xs uppercase border-b border-surface-border">
                <th className="text-left pb-2">System</th>
                <th className="text-left pb-2">Symbol</th>
                <th className="text-left pb-2">Direction</th>
                <th className="text-right pb-2">Entry</th>
                <th className="text-right pb-2">SL</th>
                <th className="text-right pb-2">TP</th>
                <th className="text-right pb-2">Risk</th>
                <th className="text-right pb-2">Unreal. PnL</th>
              </tr>
            </thead>
            <tbody>
              {openTrades.map(([key, { active_trade: t }]) => {
                if (!t) return null;
                const pnl  = pnlMap[t.symbol] ?? null;
                const pnlColor = pnl === null ? "text-slate-400" : pnl >= 0 ? "text-emerald-400" : "text-red-400";
                return (
                  <tr key={key} className="border-b border-surface-border/50 last:border-0">
                    <td className="py-3 text-brand-light font-mono text-xs">{t.system}</td>
                    <td className="py-3 font-semibold">{t.symbol.replace("USDT", "")}</td>
                    <td className="py-3"><DirectionBadge dir={t.direction} /></td>
                    <td className="py-3 text-right font-mono">{t.fill_price.toFixed(4)}</td>
                    <td className="py-3 text-right font-mono text-red-400">{t.stop_loss.toFixed(4)}</td>
                    <td className="py-3 text-right font-mono text-emerald-400">{t.take_profit.toFixed(4)}</td>
                    <td className="py-3 text-right text-slate-300">${t.dollar_risk.toFixed(2)}</td>
                    <td className={`py-3 text-right font-semibold ${pnlColor}`}>
                      {pnl === null ? "—" : `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
