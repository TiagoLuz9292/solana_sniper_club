"use client";

import { useState, useRef, useEffect } from "react";
import type { Trade } from "@/types";
import { fmtPrice } from "@/lib/format";

type Filter = { system: string; symbol: string; direction: string; outcome: string };
type TradeSortKey = "close_ts" | "system" | "symbol" | "direction" | "pnl_r" | "pnl_usd" | "outcome";
type SortDir = "asc" | "desc";

const INITIAL: Filter = { system: "All", symbol: "All", direction: "All", outcome: "All" };

const POLL_MS = 60_000;

const COL_HEADERS: { label: string; className: string; sortKey?: TradeSortKey }[] = [
  { label: "",        className: "w-5 pb-2 pr-2" },
  { label: "Date",    className: "text-left pb-2 pr-4",  sortKey: "close_ts" },
  { label: "System",  className: "text-left pb-2 pr-4",  sortKey: "system" },
  { label: "Symbol",  className: "text-left pb-2 pr-4",  sortKey: "symbol" },
  { label: "Dir",     className: "text-left pb-2 pr-4",  sortKey: "direction" },
  { label: "Entry",   className: "text-right pb-2 pr-4" },
  { label: "Exit",    className: "text-right pb-2 pr-4" },
  { label: "PnL (R)", className: "text-right pb-2 pr-4", sortKey: "pnl_r" },
  { label: "PnL ($)", className: "text-right pb-2 pr-4", sortKey: "pnl_usd" },
  { label: "Result",  className: "text-right pb-2",       sortKey: "outcome" },
];

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-surface border border-surface-border text-slate-300 text-xs rounded px-2 py-1 outline-none focus:border-brand"
    >
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}

export default function TradeHistory({ trades: initialTrades, apiPath }: { trades: Trade[]; apiPath?: string }) {
  const [trades, setTrades] = useState<Trade[]>(initialTrades);
  const [filters, setFilters] = useState<Filter>(INITIAL);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [showSticky, setShowSticky] = useState(false);
  const [colWidths, setColWidths] = useState<number[]>([]);
  const [stickyLeft, setStickyLeft] = useState(0);
  const [stickyWidth, setStickyWidth] = useState(0);
  const [sortKey, setSortKey] = useState<TradeSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const cardRef     = useRef<HTMLDivElement>(null);
  const theadRowRef = useRef<HTMLTableRowElement>(null);
  const wrapRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (!theadRowRef.current || !cardRef.current || !wrapRef.current) return;
      const headerBottom = theadRowRef.current.getBoundingClientRect().bottom;
      const cardBottom   = cardRef.current.getBoundingClientRect().bottom;
      const wrapRect     = wrapRef.current.getBoundingClientRect();
      const show = headerBottom < 0 && cardBottom > 40;
      if (show) {
        const ths = Array.from(theadRowRef.current.querySelectorAll("th"));
        setColWidths(ths.map(th => th.getBoundingClientRect().width));
        setStickyLeft(wrapRect.left);
        setStickyWidth(wrapRect.width);
      }
      setShowSticky(show);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!apiPath) return;
    const fetchTrades = async () => {
      try {
        const res = await fetch(apiPath, { cache: "no-store" });
        if (res.ok) setTrades(await res.json());
      } catch { /* keep stale */ }
    };
    fetchTrades();
    const id = setInterval(fetchTrades, POLL_MS);
    return () => clearInterval(id);
  }, [apiPath]);

  const set = (key: keyof Filter) => (v: string) => setFilters(f => ({ ...f, [key]: v }));

  const handleSort = (key: TradeSortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const symbols = ["All", ...Array.from(new Set(trades.map(t => t.symbol.replace("USDT", ""))))];

  const filtered = trades.filter(t => {
    if (filters.system    !== "All" && t.system    !== filters.system)   return false;
    if (filters.symbol    !== "All" && t.symbol    !== `${filters.symbol}USDT`) return false;
    if (filters.direction !== "All" && t.direction !== filters.direction.toLowerCase()) return false;
    if (filters.outcome   !== "All" && t.outcome   !== filters.outcome.toLowerCase())  return false;
    return true;
  });

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        let aVal: string | number, bVal: string | number;
        if (sortKey === "close_ts")       { aVal = a.close_ts ?? "";  bVal = b.close_ts ?? ""; }
        else if (sortKey === "system")    { aVal = a.system ?? "";    bVal = b.system ?? ""; }
        else if (sortKey === "symbol")    { aVal = a.symbol ?? "";    bVal = b.symbol ?? ""; }
        else if (sortKey === "direction") { aVal = a.direction ?? ""; bVal = b.direction ?? ""; }
        else if (sortKey === "pnl_r")    { aVal = a.pnl_r ?? 0;     bVal = b.pnl_r ?? 0; }
        else if (sortKey === "pnl_usd")  { aVal = a.pnl_usd ?? 0;   bVal = b.pnl_usd ?? 0; }
        else                             { aVal = a.outcome ?? "";   bVal = b.outcome ?? ""; }
        if (typeof aVal === "string" && typeof bVal === "string")
          return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      })
    : filtered;

  const toggle = (i: number) =>
    setExpanded(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });

  return (
    <div ref={cardRef} className="bg-surface-card border border-surface-border rounded-xl p-6">

      {/* Fixed sticky header clone — visible only when real header is above viewport */}
      {showSticky && (
        <div
          className="fixed top-0 z-50 border-b border-surface-border overflow-hidden"
          style={{ left: stickyLeft, width: stickyWidth, background: "#16161f" }}
        >
          <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
            <colgroup>
              {colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
            </colgroup>
            <thead>
              <tr className="text-slate-400 text-xs uppercase">
                {COL_HEADERS.map((col, i) => {
                  const active = sortKey === col.sortKey;
                  return (
                    <th
                      key={i}
                      className={`${col.className}${col.sortKey ? " cursor-pointer select-none hover:text-slate-200 transition-colors" : ""}${active ? " text-slate-200" : ""}`}
                      onClick={col.sortKey ? () => handleSort(col.sortKey!) : undefined}
                    >
                      {col.label}
                      {col.sortKey && (
                        <span className={`ml-0.5 ${active ? "text-slate-300" : "text-slate-600"}`}>
                          {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
          </table>
        </div>
      )}

      {/* Fee callout */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <p className="text-sm text-emerald-400">
          Exchange fees shown per trade (expand any row) — calculate yours and compare rates across crypto exchanges on
        </p>
        <a
          href="https://tradefeecalc.com/calculators/bybit-trading-fee-calculator"
          target="_blank"
          rel="noopener noreferrer"
          className="self-start sm:self-auto flex-shrink-0 text-2xl font-bold text-amber-300 hover:text-amber-200 transition-colors px-4 py-1.5 rounded-lg border border-amber-700/40 bg-amber-900/15 hover:bg-amber-900/25"
          style={{ textShadow: "0 0 6px #fcd34d80" }}
        >
          tradefeecalc.com →
        </a>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-5">
        <h2 className="text-lg font-semibold text-white mr-2">Trade History</h2>
        <label className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-500">System</span>
          <Select value={filters.system}    onChange={set("system")}    options={["All", "ER", "VW"]} />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-500">Symbol</span>
          <Select value={filters.symbol}    onChange={set("symbol")}    options={symbols} />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-500">Direction</span>
          <Select value={filters.direction} onChange={set("direction")} options={["All", "Long", "Short"]} />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-500">Outcome</span>
          <Select value={filters.outcome}   onChange={set("outcome")}   options={["All", "Win", "Loss"]} />
        </label>
        <span className="text-xs text-slate-500 ml-auto">{filtered.length} trades</span>
      </div>

      <div ref={wrapRef} className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr ref={theadRowRef} className="text-slate-400 text-xs uppercase border-b border-surface-border">
              {COL_HEADERS.map((col, i) => {
                const active = sortKey === col.sortKey;
                return (
                  <th
                    key={i}
                    className={`${col.className}${col.sortKey ? " cursor-pointer select-none hover:text-slate-200 transition-colors" : ""}${active ? " text-slate-200" : ""}`}
                    onClick={col.sortKey ? () => handleSort(col.sortKey!) : undefined}
                  >
                    {col.label}
                    {col.sortKey && (
                      <span className={`ml-0.5 ${active ? "text-slate-300" : "text-slate-600"}`}>
                        {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => {
              const isWin = t.outcome === "win";
              const isOpen = expanded.has(i);
              return (
                <>
                  <tr
                    key={`${t.close_ts}-${i}`}
                    onClick={() => toggle(i)}
                    className="border-b border-surface-border/40 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="py-2 pr-2 text-slate-500">
                      <span className={`inline-block text-xs transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}>▶</span>
                    </td>
                    <td className="py-2 pr-4 text-slate-400 text-xs tabular-nums">
                      {new Date(t.close_ts).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-4 text-brand-light font-mono text-xs">{t.system}</td>
                    <td className="py-2 pr-4 font-semibold">{t.symbol?.replace("USDT", "") ?? "—"}</td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs font-semibold ${t.direction === "long" ? "text-emerald-400" : "text-red-400"}`}>
                        {t.direction === "long" ? "▲" : "▼"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right font-mono text-xs">{fmtPrice(t.fill_price)}</td>
                    <td className="py-2 pr-4 text-right font-mono text-xs">{fmtPrice(t.exit_price)}</td>
                    <td className={`py-2 pr-4 text-right font-semibold tabular-nums ${isWin ? "text-emerald-400" : "text-red-400"}`}>
                      {(t.pnl_r ?? 0) >= 0 ? "+" : ""}{(t.pnl_r ?? 0).toFixed(1)}R
                    </td>
                    <td className={`py-2 pr-4 text-right font-semibold tabular-nums ${isWin ? "text-emerald-400" : "text-red-400"}`}>
                      {(t.pnl_usd ?? 0) >= 0 ? "+$" : "-$"}{Math.abs(t.pnl_usd ?? 0).toFixed(2)}
                    </td>
                    <td className="py-2 text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${isWin ? "bg-emerald-900 text-emerald-300" : "bg-red-900 text-red-300"}`}>
                        {t.outcome?.toString().toUpperCase() ?? "—"}
                      </span>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={`${t.close_ts}-${i}-detail`} className="bg-white/3 border-b border-surface-border/40">
                      <td colSpan={10} className="px-4 py-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-400">
                          <div><span className="text-slate-500">SL</span> {fmtPrice(t.stop_loss)}</div>
                          <div><span className="text-slate-500">TP</span> {fmtPrice(t.take_profit)} ({t.tp_r}R)</div>
                          <div><span className="text-slate-500">Risk $</span> {(t.dollar_risk ?? 0).toFixed(2)}</div>
                          <div><span className="text-slate-500">Bars held</span> {t.candles_held ?? "—"}</div>
                          {(() => {
                            const dist = Math.abs(t.fill_price - t.stop_loss) / t.fill_price;
                            if (dist <= 0) return null;
                            const notional = Math.round(t.dollar_risk / dist);
                            const margin   = Math.round(notional / 20);
                            return (
                              <>
                                <div><span className="text-slate-500">Notional</span> ${notional.toLocaleString()}</div>
                                <div><span className="text-slate-500">Margin</span> ${margin.toLocaleString()}</div>
                              </>
                            );
                          })()}
                          <div><span className="text-slate-500">Entry type</span> {t.entry_type}</div>
                          <div><span className="text-slate-500">HTF aligned</span> {t.htf_multi_aligned ? "Yes" : "No"}</div>
                          {t.fee_usd !== undefined && t.fee_usd > 0 && (
                            <div><span className="text-slate-500">Fee paid</span> <span className="text-amber-400">${t.fee_usd.toFixed(4)}</span></div>
                          )}
                          <div><span className="text-slate-500">DD after</span> {(t.dd_pct ?? 0).toFixed(2)}%</div>
                          <div><span className="text-slate-500">Equity after</span> ${(t.equity_after ?? 0).toFixed(2)}</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
