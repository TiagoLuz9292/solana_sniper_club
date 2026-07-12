"use client";

import { useEffect, useState } from "react";

type SubState =
  | { state: "IDLE" }
  | { state: "PENDING"; direction: string; level: number; bars_since_order: number }
  | { state: "OPEN"; direction: string; fill_price: number; sl: number; tp: number };

type HTFFrame = {
  ema_trend: "bullish" | "bearish" | "neutral";
  macd_dir: "positive" | "negative";
  aligned_long: boolean;
  aligned_short: boolean;
};

type HTFSummary = {
  "60"?: HTFFrame;
  "120"?: HTFFrame;
  "240"?: HTFFrame;
  all_aligned_long?: boolean;
  all_aligned_short?: boolean;
};

type SymbolEntry = {
  active_system: "ER" | "VW" | null;
  htf?: HTFSummary;
  ER?: SubState;
  VW?: SubState;
};

const TF_LABELS: Record<string, string> = { "60": "1h", "120": "2h", "240": "4h" };

function trendColor(trend: string) {
  return trend === "bullish" ? "text-emerald-400" : trend === "bearish" ? "text-red-400" : "text-slate-500";
}

function trendArrow(trend: string) {
  return trend === "bullish" ? "▲" : trend === "bearish" ? "▼" : "–";
}

function HTFRow({ htf }: { htf: HTFSummary | undefined }) {
  if (!htf || !htf["60"]) {
    return <p className="text-[11px] text-slate-600 mt-1">HTF: warming up…</p>;
  }
  return (
    <div className="mt-1 mb-2">
      <div className="flex items-center gap-2">
        {(["60", "120", "240"] as const).map((tf) => {
          const f = htf[tf];
          if (!f) return null;
          return (
            <span
              key={tf}
              title={`${TF_LABELS[tf]}: ${f.ema_trend} / MACD ${f.macd_dir}`}
              className={`text-xs font-mono ${trendColor(f.ema_trend)}`}
            >
              {TF_LABELS[tf]}{trendArrow(f.ema_trend)}
            </span>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-1">
        {htf.all_aligned_long && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-emerald-900/60 text-emerald-300 border-emerald-700">
            HTF ready ▲
          </span>
        )}
        {htf.all_aligned_short && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-red-900/60 text-red-300 border-red-700">
            HTF ready ▼
          </span>
        )}
        {!htf.all_aligned_long && !htf.all_aligned_short && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-slate-800 text-slate-500 border-slate-700">
            not aligned
          </span>
        )}
      </div>
    </div>
  );
}

type MonitorData = {
  ts?: string;
  [symbol: string]: SymbolEntry | string | undefined;
};

const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "ADAUSDT", "XRPUSDT", "DOGEUSDT"];

function directionLabel(dir: string) {
  return dir === "long" ? "▲ Long" : "▼ Short";
}

function directionColor(dir: string) {
  return dir === "long" ? "text-emerald-400" : "text-red-400";
}

function SubRow({ system, data }: { system: "ER" | "VW"; data: SubState | undefined }) {
  const state = data?.state ?? "IDLE";
  const badgeStyle =
    state === "OPEN"    ? "bg-emerald-900/60 text-emerald-300 border-emerald-700" :
    state === "PENDING" ? "bg-yellow-900/60 text-yellow-300 border-yellow-700" :
                          "bg-slate-800 text-slate-500 border-slate-700";

  return (
    <div className="border-t border-surface-border/60 pt-2 mt-2 first:border-t-0 first:pt-0 first:mt-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-300">{system}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${badgeStyle}`}>
          {state}
        </span>
      </div>

      {state === "PENDING" && data && "level" in data && (
        <div className="space-y-0.5 text-xs mt-1">
          <p className={`font-medium ${directionColor(data.direction)}`}>
            {directionLabel(data.direction)}
          </p>
          <p className="text-slate-500">
            limit @ <span className="text-white font-mono">{data.level.toPrecision(6)}</span>
            {" "}(bar {data.bars_since_order})
          </p>
        </div>
      )}

      {state === "OPEN" && data && "fill_price" in data && (
        <div className="space-y-0.5 text-xs mt-1">
          <p className={`font-medium ${directionColor(data.direction)}`}>
            {directionLabel(data.direction)}
          </p>
          <p className="text-slate-500">
            entry <span className="text-white font-mono">{data.fill_price.toPrecision(6)}</span>
          </p>
          <div className="flex gap-2">
            <span className="text-slate-500">
              SL <span className="text-red-400 font-mono">{data.sl.toPrecision(6)}</span>
            </span>
            <span className="text-slate-500">
              TP <span className="text-emerald-400 font-mono">{data.tp.toPrecision(6)}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function StateCard({ symbol, data }: { symbol: string; data: SymbolEntry | undefined }) {
  const activeSystem = data?.active_system ?? null;
  const hasER = !!data?.ER;
  const hasVW = !!data?.VW;

  const borderColor = activeSystem ? "border-sky-600" : "border-surface-border";

  return (
    <div className={`bg-surface rounded-lg border ${borderColor} p-3 flex flex-col min-w-0`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-sm font-semibold text-white truncate">
          {symbol.replace("USDT", "")}
        </span>
        {activeSystem ? (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-sky-900/60 text-sky-300 border-sky-700">
            {activeSystem} locked
          </span>
        ) : (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-slate-800 text-slate-500 border-slate-700">
            free
          </span>
        )}
      </div>
      <HTFRow htf={data?.htf} />
      {hasER && <SubRow system="ER" data={data?.ER} />}
      {hasVW && <SubRow system="VW" data={data?.VW} />}
    </div>
  );
}

export default function ERVWMonitor({ apiPath }: { apiPath: string }) {
  const [data, setData] = useState<MonitorData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  async function poll() {
    try {
      const res = await fetch(apiPath, { cache: "no-store" });
      if (res.ok) {
        const json: MonitorData = await res.json();
        setData(json);
        if (json.ts) {
          setLastUpdate(new Date(json.ts as string).toLocaleTimeString());
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPath]);

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-surface-border p-4">
        <h2 className="text-sm font-semibold text-slate-400 mb-3">ER / VW Symbol States</h2>
        <p className="text-xs text-slate-500">Waiting for first tick…</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-surface-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">ER / VW Symbol States</h2>
        {lastUpdate && (
          <span className="text-xs text-slate-500">Updated {lastUpdate}</span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {SYMBOLS.map((sym) => (
          <StateCard key={sym} symbol={sym} data={data[sym] as SymbolEntry | undefined} />
        ))}
      </div>
    </div>
  );
}
