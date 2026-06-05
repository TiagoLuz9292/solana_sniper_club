"use client";

import { useEffect, useState } from "react";
import type { ActiveState, ActiveTrade } from "@/types";

const BYBIT_PUBLIC = "https://api-demo.bybit.com/v5/market/tickers?category=linear&symbol=";

function DirectionBadge({ dir }: { dir: string }) {
  const isLong = dir === "long";
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${isLong ? "bg-emerald-900 text-emerald-300" : "bg-red-900 text-red-300"}`}>
      {isLong ? "▲ L" : "▼ S"}
    </span>
  );
}

function calcPnl(t: ActiveTrade, price: number): number {
  const qty = t.dollar_risk / Math.abs(t.fill_price - t.stop_loss);
  return qty * (price - t.fill_price) * (t.direction === "long" ? 1 : -1);
}

async function fetchTicker(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(BYBIT_PUBLIC + symbol, { cache: "no-store" });
    const data = await res.json();
    const price = data?.result?.list?.[0]?.lastPrice;
    return price ? parseFloat(price) : null;
  } catch { return null; }
}

function TradeCard({ tradeKey, trade, pnl }: { tradeKey: string; trade: ActiveTrade; pnl: number | null }) {
  const pnlColor = pnl === null ? "text-slate-400" : pnl >= 0 ? "text-emerald-400" : "text-red-400";
  return (
    <div className="flex-shrink-0 bg-slate-800/50 border border-surface-border rounded-lg p-3 w-52">
      {/* Card header */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-xs font-semibold text-brand-light">{trade.system}</span>
        <span className="text-sm font-bold text-white">{trade.symbol.replace("USDT", "")}</span>
        <DirectionBadge dir={trade.direction} />
      </div>
      {/* Price grid */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs font-mono">
        <span className="text-slate-500">Entry</span>
        <span className="text-white text-right">{trade.fill_price.toFixed(4)}</span>
        <span className="text-slate-500">SL</span>
        <span className="text-red-400 text-right">{trade.stop_loss.toFixed(4)}</span>
        <span className="text-slate-500">TP</span>
        <span className="text-emerald-400 text-right">{trade.take_profit.toFixed(4)}</span>
        <span className="text-slate-500">Risk</span>
        <span className="text-slate-300 text-right">${trade.dollar_risk.toFixed(2)}</span>
      </div>
      {/* PnL */}
      <div className={`mt-2 pt-2 border-t border-surface-border/50 text-sm font-semibold text-right ${pnlColor}`}>
        {pnl === null ? "—" : `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`}
      </div>
    </div>
  );
}

export default function LiveStatus() {
  const [active, setActive] = useState<ActiveState | null>(null);
  const [pnlMap, setPnlMap] = useState<Record<string, number>>({});
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  async function refresh() {
    const activeRes = await fetch("/api/active").then(r => r.json()).catch(() => null);
    if (activeRes && !activeRes.error) setActive(activeRes);

    const trades = Object.entries(activeRes ?? {})
      .filter(([, v]: [string, unknown]) => !!(v as { active_trade?: ActiveTrade }).active_trade)
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

  const openTrades = Object.entries(active ?? {}).filter(([, v]) => !!v.active_trade);

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl px-6 py-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${openTrades.length > 0 ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
          <h2 className="text-sm font-semibold text-white">
            Open Trades
            {openTrades.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-400 text-xs font-bold">
                {openTrades.length}
              </span>
            )}
          </h2>
        </div>
        <span className="text-xs text-slate-500">
          {lastUpdate ? `updated ${lastUpdate.toLocaleTimeString()}` : "loading..."}
        </span>
      </div>

      {openTrades.length === 0 ? (
        <p className="text-slate-500 text-xs">No active positions — scanning market...</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {openTrades.map(([key, { active_trade: t }]) => {
            if (!t) return null;
            return <TradeCard key={key} tradeKey={key} trade={t} pnl={pnlMap[t.symbol] ?? null} />;
          })}
        </div>
      )}
    </div>
  );
}
