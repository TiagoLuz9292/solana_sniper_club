"use client";

import { useEffect, useState } from "react";

interface HTFEntry {
  short_aligned: boolean;
  long_aligned: boolean;
  ema_trend: string;
  macd_dir: string;
}

interface EREntry {
  ribbon: "long_stacked" | "short_stacked" | "neutral" | "warming";
  status: "idle" | "in_trade" | "pending" | "cooldown";
  ema21: number | null;
  ema55: number | null;
  atr: number | null;
}

interface VWEntry {
  vwap: number | null;
  pct_vs_vwap: number | null;
  status: "idle" | "in_trade" | "pending" | "cooldown";
}

interface MarketStateData {
  ts: string;
  bar: number;
  equity: number;
  dd_pct: number;
  dd_tier: string;
  er: Record<string, EREntry>;
  vw: Record<string, VWEntry>;
  htf: Record<string, Record<string, HTFEntry>>;
}

const TF_LABELS: Record<string, string> = { "60": "1h", "120": "2h", "240": "4h" };
const TFS = ["60", "120", "240"];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    in_trade: "bg-emerald-900/60 text-emerald-300",
    pending:  "bg-amber-900/60 text-amber-300",
    cooldown: "bg-slate-700 text-slate-400",
    idle:     "bg-transparent text-slate-500",
    warming:  "bg-slate-700 text-slate-400",
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${styles[status] ?? ""}`}>
      {status}
    </span>
  );
}

function RibbonBadge({ ribbon }: { ribbon: string }) {
  if (ribbon === "long_stacked")  return <span className="text-emerald-400 font-semibold text-xs">⬆ LONG</span>;
  if (ribbon === "short_stacked") return <span className="text-red-400 font-semibold text-xs">⬇ SHORT</span>;
  if (ribbon === "neutral")       return <span className="text-slate-400 text-xs">— NEUT</span>;
  return <span className="text-slate-500 text-xs">warming</span>;
}

function AlignBox({ aligned, label }: { aligned: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-sm ${aligned ? "text-emerald-400" : "text-red-400"}`}>
        {aligned ? "✓" : "✗"}
      </span>
    </div>
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

export default function MarketState() {
  const [data, setData] = useState<MarketStateData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  async function refresh() {
    const res = await fetch("/api/market-state").then((r) => r.json()).catch(() => null);
    if (res && !res.error) {
      setData(res);
      setLastUpdate(new Date());
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, []);

  if (!data) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Market State</h2>
          <span className="text-xs text-slate-500">Updates every 15m</span>
        </div>
        <p className="text-slate-400 text-sm">Waiting for first 15m tick — data will appear automatically.</p>
      </div>
    );
  }

  const erSymbols = Object.keys(data.er).sort();
  const vwSymbols = Object.keys(data.vw).sort();
  const allSymbols = Array.from(new Set([...erSymbols, ...vwSymbols])).sort();

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Market State</h2>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>bar {data.bar} · {formatTs(data.ts)}</span>
          <span className="text-slate-600">|</span>
          <span>eq <span className="text-white font-mono">${data.equity.toFixed(2)}</span></span>
          <span className="text-slate-600">|</span>
          <span>DD <span className={`font-mono ${data.dd_pct > 5 ? "text-amber-400" : "text-slate-300"}`}>{data.dd_pct.toFixed(1)}%</span> [{data.dd_tier}]</span>
          <span className="text-slate-600">|</span>
          <span>{lastUpdate ? `polled ${lastUpdate.toLocaleTimeString()}` : ""}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ER ribbon */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">ER — Ribbon</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-surface-border">
                <th className="text-left pb-1.5">Symbol</th>
                <th className="text-left pb-1.5">Ribbon</th>
                <th className="text-left pb-1.5">Status</th>
                <th className="text-right pb-1.5 font-mono">ATR</th>
              </tr>
            </thead>
            <tbody>
              {erSymbols.map((sym) => {
                const e = data.er[sym];
                return (
                  <tr key={sym} className="border-b border-surface-border/30 last:border-0">
                    <td className="py-2 font-semibold text-white">{sym.replace("USDT", "")}</td>
                    <td className="py-2"><RibbonBadge ribbon={e.ribbon} /></td>
                    <td className="py-2"><StatusBadge status={e.status} /></td>
                    <td className="py-2 text-right font-mono text-slate-400 text-xs">
                      {e.atr !== null ? e.atr.toFixed(5) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* VW vs VWAP */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">VW — vs VWAP</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-surface-border">
                <th className="text-left pb-1.5">Symbol</th>
                <th className="text-right pb-1.5">% vs VWAP</th>
                <th className="text-left pb-1.5 pl-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {vwSymbols.map((sym) => {
                const v = data.vw[sym];
                const pct = v.pct_vs_vwap;
                const pctColor = pct === null ? "text-slate-500"
                  : pct > 0 ? "text-emerald-400" : "text-red-400";
                return (
                  <tr key={sym} className="border-b border-surface-border/30 last:border-0">
                    <td className="py-2 font-semibold text-white">{sym.replace("USDT", "")}</td>
                    <td className={`py-2 text-right font-mono text-sm ${pctColor}`}>
                      {pct !== null ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%` : "—"}
                    </td>
                    <td className="py-2 pl-3"><StatusBadge status={v.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* HTF alignment */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">HTF Alignment</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-surface-border">
                <th className="text-left pb-1.5">Symbol</th>
                {TFS.map((tf) => (
                  <th key={`s-${tf}`} className="text-center pb-1.5">
                    <span className="text-red-400">S</span>·{TF_LABELS[tf]}
                  </th>
                ))}
                {TFS.map((tf) => (
                  <th key={`l-${tf}`} className="text-center pb-1.5">
                    <span className="text-emerald-400">L</span>·{TF_LABELS[tf]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allSymbols.map((sym) => {
                const htf = data.htf[sym];
                if (!htf) return null;
                return (
                  <tr key={sym} className="border-b border-surface-border/30 last:border-0">
                    <td className="py-2 font-semibold text-white">{sym.replace("USDT", "")}</td>
                    {TFS.map((tf) => (
                      <td key={`s-${tf}`} className="py-2 text-center text-sm">
                        <span className={htf[tf]?.short_aligned ? "text-emerald-400" : "text-red-400"}>
                          {htf[tf]?.short_aligned ? "✓" : "✗"}
                        </span>
                      </td>
                    ))}
                    {TFS.map((tf) => (
                      <td key={`l-${tf}`} className="py-2 text-center text-sm">
                        <span className={htf[tf]?.long_aligned ? "text-emerald-400" : "text-red-400"}>
                          {htf[tf]?.long_aligned ? "✓" : "✗"}
                        </span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
