"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, LineStyle } from "lightweight-charts";
import type { EquityPoint, Trade } from "@/types";

export default function EquityChart({ data, trades, currentEquity, startingEquity = 300 }: { data: EquityPoint[]; trades: Trade[]; currentEquity?: number; startingEquity?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#16161f" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "#22222e", style: LineStyle.Dotted },
        horzLines: { color: "#22222e", style: LineStyle.Dotted },
      },
      crosshair: { vertLine: { color: "#7c3aed" }, horzLine: { color: "#7c3aed" } },
      rightPriceScale: { borderColor: "#22222e" },
      timeScale: { borderColor: "#22222e", timeVisible: true },
      width:  containerRef.current.clientWidth,
      height: 320,
    });

    const series = chart.addLineSeries({
      color: "#7c3aed",
      lineWidth: 2,
      priceFormat: { type: "price", precision: 2, minMove: 0.01 },
    });

    // Build merged equity map from both trades.csv and equity.csv
    // trades.csv covers all history; equity.csv may be missing early data
    const seen = new Map<number, number>();

    // First pass: trades.csv (equity_after = equity after that trade)
    const sortedTrades = [...trades].sort(
      (a, b) => new Date(a.close_ts).getTime() - new Date(b.close_ts).getTime()
    );
    for (const t of sortedTrades) {
      const ts = Math.floor(new Date(t.close_ts).getTime() / 1000);
      if (!isNaN(ts) && t.equity_after != null && isFinite(t.equity_after)) seen.set(ts, t.equity_after);
    }

    // Second pass: equity.csv (overwrites with its values where they exist)
    for (const pt of data) {
      const ts = Math.floor(new Date(pt.ts).getTime() / 1000);
      if (!isNaN(ts) && pt.equity != null && isFinite(pt.equity)) seen.set(ts, pt.equity);
    }

    const allSorted = Array.from(seen.entries()).sort(([a], [b]) => a - b);
    if (allSorted.length === 0) return;

    // Overwrite last point with real balance — absorbs fee gap silently
    const safeCurrentEquity = (currentEquity != null && isFinite(currentEquity as number)) ? currentEquity : null;
    if (safeCurrentEquity !== null && allSorted.length > 0) {
      allSorted[allSorted.length - 1][1] = safeCurrentEquity;
    }

    const safeStart = (startingEquity != null && isFinite(startingEquity as number) && startingEquity > 0) ? startingEquity : 300;
    const points = [
      { time: (allSorted[0][0] - 86400) as number, value: safeStart },
      ...allSorted.map(([time, value]) => ({ time: time as number, value })),
    ];
    series.setData(points as Parameters<typeof series.setData>[0]);
    chart.timeScale().fitContent();

    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      chart.applyOptions({ width });
    });
    ro.observe(containerRef.current);

    return () => { chart.remove(); ro.disconnect(); };
  }, [data, trades, startingEquity]);

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Equity Curve</h2>
      <div ref={containerRef} />
    </div>
  );
}
