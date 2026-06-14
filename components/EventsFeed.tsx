"use client";

import { useEffect, useState } from "react";
import { fmtPrice } from "@/lib/format";

interface BotEvent {
  ts: string;
  type: "setup" | "setup_cancelled" | "trade_open" | "trade_close";
  system: string;
  symbol: string;
  direction?: "long" | "short";
  entry_type?: string;
  limit_price?: number;
  fill_price?: number;
  exit_price?: number;
  stop_loss?: number;
  take_profit?: number;
  tp_r?: number;
  dollar_risk?: number;
  outcome?: "win" | "loss" | "ambiguous";
  pnl_r?: number;
  pnl_usd?: number;
  fee_usd?: number;
  candles_held?: number;
  equity_after?: number;
  dd_pct?: number;
  reason?: string;
  htf_multi_aligned?: boolean;
}

const MAX_DISPLAY = 30;

function eventIcon(e: BotEvent): string {
  if (e.type === "setup")           return "🟡";
  if (e.type === "setup_cancelled") return "🚫";
  if (e.type === "trade_open")      return "🟢";
  if (e.type === "trade_close") {
    if (e.outcome === "win")        return "✅";
    if (e.outcome === "loss")       return "❌";
    return "⚠️";
  }
  return "•";
}

function eventLabel(e: BotEvent): string {
  if (e.type === "setup")           return "New Setup";
  if (e.type === "setup_cancelled") return "Cancelled";
  if (e.type === "trade_open")      return "Trade Opened";
  if (e.type === "trade_close")     return `Trade Closed — ${e.outcome?.toUpperCase()}`;
  return e.type;
}

function directionTag(dir?: string) {
  if (!dir) return null;
  const isLong = dir === "long";
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${isLong ? "bg-emerald-900/60 text-emerald-300" : "bg-red-900/60 text-red-300"}`}>
      {isLong ? "▲ L" : "▼ S"}
    </span>
  );
}

function formatTs(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
      hour12: false,
    });
  } catch { return ts; }
}

function EventRow({ e }: { e: BotEvent }) {
  const isClose = e.type === "trade_close";
  const isOpen  = e.type === "trade_open";
  const isSetup = e.type === "setup";
  const isCancelled = e.type === "setup_cancelled";

  const pnlColor = e.pnl_r !== undefined
    ? e.pnl_r >= 0 ? "text-emerald-400" : "text-red-400"
    : "";

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-surface-border/40 last:border-0">
      <span className="text-base mt-0.5 select-none">{eventIcon(e)}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-mono">{formatTs(e.ts)}</span>
          <span className="text-xs font-semibold text-brand-light">{e.system}</span>
          <span className="text-sm font-bold text-white">{e.symbol.replace("USDT", "")}</span>
          {directionTag(e.direction)}
          <span className="text-xs text-slate-300">{eventLabel(e)}</span>
        </div>

        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-400 font-mono">
          {(isSetup || isOpen) && e.fill_price !== undefined && (
            <span>fill <span className="text-white">{fmtPrice(e.fill_price)}</span></span>
          )}
          {isSetup && e.limit_price !== undefined && e.entry_type === "limit" && (
            <span>limit <span className="text-white">{fmtPrice(e.limit_price)}</span></span>
          )}
          {(isSetup || isOpen) && e.stop_loss !== undefined && (
            <span>SL <span className="text-red-400">{fmtPrice(e.stop_loss)}</span></span>
          )}
          {(isSetup || isOpen) && e.take_profit !== undefined && (
            <span>TP <span className="text-emerald-400">{fmtPrice(e.take_profit)}</span> ({e.tp_r}R)</span>
          )}
          {(isSetup || isOpen) && e.dollar_risk !== undefined && (
            <span>risk <span className="text-slate-300">${e.dollar_risk.toFixed(2)}</span></span>
          )}
          {(isSetup || isOpen) && (() => {
            const price = e.fill_price ?? e.limit_price;
            const dist  = price && e.stop_loss ? Math.abs(price - e.stop_loss) / price : 0;
            if (!e.dollar_risk || dist <= 0) return null;
            const notional = Math.round(e.dollar_risk / dist);
            const margin   = Math.round(notional / 20);
            return (
              <span>pos <span className="text-slate-300">${margin}m / ${notional.toLocaleString()}n</span></span>
            );
          })()}
          {isClose && e.exit_price !== undefined && (
            <span>exit <span className="text-white">{fmtPrice(e.exit_price)}</span></span>
          )}
          {isClose && e.pnl_r !== undefined && (
            <span className={pnlColor}>
              {e.pnl_r >= 0 ? "+" : ""}{e.pnl_r.toFixed(2)}R
              {e.pnl_usd !== undefined && ` ($${e.pnl_usd >= 0 ? "+" : ""}${e.pnl_usd.toFixed(2)})`}
            </span>
          )}
          {isClose && e.fee_usd !== undefined && e.fee_usd > 0 && (
            <span className="text-amber-400/80">fee ${e.fee_usd.toFixed(4)}</span>
          )}
          {isClose && e.equity_after !== undefined && (
            <span>eq <span className="text-slate-300">${e.equity_after.toFixed(2)}</span></span>
          )}
          {isClose && e.candles_held !== undefined && (
            <span>{e.candles_held} bars</span>
          )}
          {isCancelled && e.reason && (
            <span className="text-amber-400">{e.reason}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EventsFeed({ apiPath = "/api/events" }: { apiPath?: string }) {
  const [events, setEvents] = useState<BotEvent[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  async function refresh() {
    const data = await fetch(apiPath).then((r) => r.json()).catch(() => null);
    if (Array.isArray(data)) {
      setEvents(data.slice(0, MAX_DISPLAY));
      setLastUpdate(new Date());
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Events Feed</h2>
        <span className="text-xs text-slate-400">
          {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : "Loading..."}
        </span>
      </div>

      {events.length === 0 ? (
        <p className="text-slate-400 text-sm">No events yet — setups, opens, and closes will appear here in real time.</p>
      ) : (
        <div className="max-h-96 overflow-y-auto pr-1">
          {events.map((e, i) => <EventRow key={i} e={e} />)}
        </div>
      )}
    </div>
  );
}
