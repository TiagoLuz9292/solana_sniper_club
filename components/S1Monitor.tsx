"use client";

import { useEffect, useState } from "react";

type SymbolState =
  | { state: "IDLE" }
  | { state: "WATCHING"; direction: string; swept_level: number; bars_watched: number; max_watch: number }
  | { state: "PENDING"; direction: string; level: number; bars_since_order: number; max_fill: number }
  | { state: "OPEN"; direction: string; fill_price: number; sl: number; tp: number };

type MonitorData = {
  ts?: string;
  [symbol: string]: SymbolState | string | undefined;
};

const SYMBOLS = ["ETHUSDT", "SOLUSDT", "ADAUSDT", "XRPUSDT", "DOGEUSDT"];

function directionLabel(dir: string) {
  return dir === "long" ? "▲ Long" : "▼ Short";
}

function directionColor(dir: string) {
  return dir === "long" ? "text-emerald-400" : "text-red-400";
}

function StateCard({ symbol, data }: { symbol: string; data: SymbolState | undefined }) {
  const state = data?.state ?? "IDLE";

  const borderColor =
    state === "OPEN"    ? "border-emerald-600" :
    state === "PENDING" ? "border-yellow-600" :
    state === "WATCHING"? "border-sky-600" :
                          "border-surface-border";

  const badgeStyle =
    state === "OPEN"    ? "bg-emerald-900/60 text-emerald-300 border-emerald-700" :
    state === "PENDING" ? "bg-yellow-900/60 text-yellow-300 border-yellow-700" :
    state === "WATCHING"? "bg-sky-900/60 text-sky-300 border-sky-700" :
                          "bg-slate-800 text-slate-500 border-slate-700";

  return (
    <div className={`bg-surface rounded-lg border ${borderColor} p-4 flex flex-col gap-2 min-w-0`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-white truncate">
          {symbol.replace("USDT", "")}
        </span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
          {state}
        </span>
      </div>

      {state === "IDLE" && (
        <p className="text-xs text-slate-500">Scanning for sweeps</p>
      )}

      {state === "WATCHING" && data && "swept_level" in data && (
        <div className="space-y-1 text-xs">
          <p className={`font-semibold ${directionColor(data.direction)}`}>
            {directionLabel(data.direction)}
          </p>
          <p className="text-slate-400">
            Swept level: <span className="text-white font-mono">{data.swept_level.toPrecision(6)}</span>
          </p>
          <p className="text-slate-400">
            Bar {data.bars_watched} / {data.max_watch} — waiting for confirmation
          </p>
        </div>
      )}

      {state === "PENDING" && data && "level" in data && (
        <div className="space-y-1 text-xs">
          <p className={`font-semibold ${directionColor(data.direction)}`}>
            {directionLabel(data.direction)}
          </p>
          <p className="text-slate-400">
            Limit @ <span className="text-white font-mono">{data.level.toPrecision(6)}</span>
          </p>
          <p className="text-slate-400">
            Bar {data.bars_since_order} / {data.max_fill} — waiting for fill
          </p>
        </div>
      )}

      {state === "OPEN" && data && "fill_price" in data && (
        <div className="space-y-1 text-xs">
          <p className={`font-semibold ${directionColor(data.direction)}`}>
            {directionLabel(data.direction)}
          </p>
          <p className="text-slate-400">
            Entry: <span className="text-white font-mono">{data.fill_price.toPrecision(6)}</span>
          </p>
          <div className="flex gap-3">
            <span className="text-slate-400">
              SL: <span className="text-red-400 font-mono">{data.sl.toPrecision(6)}</span>
            </span>
            <span className="text-slate-400">
              TP: <span className="text-emerald-400 font-mono">{data.tp.toPrecision(6)}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function S1Monitor() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  async function poll() {
    try {
      const res = await fetch("/api/s1/monitor", { cache: "no-store" });
      if (res.ok) {
        const json: MonitorData = await res.json();
        setData(json);
        if (json.ts) {
          setLastUpdate(new Date(json.ts).toLocaleTimeString());
        }
      }
    } catch {
      // network blip — keep stale data
    }
  }

  useEffect(() => {
    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, []);

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-surface-border p-4">
        <h2 className="text-sm font-semibold text-slate-400 mb-3">S1 Symbol States</h2>
        <p className="text-xs text-slate-500">Waiting for first tick…</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-surface-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">S1 Symbol States</h2>
        {lastUpdate && (
          <span className="text-xs text-slate-500">Updated {lastUpdate}</span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {SYMBOLS.map((sym) => (
          <StateCard key={sym} symbol={sym} data={data[sym] as SymbolState | undefined} />
        ))}
      </div>
    </div>
  );
}
