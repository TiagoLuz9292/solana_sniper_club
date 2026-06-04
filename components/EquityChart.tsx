"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, LineStyle } from "lightweight-charts";
import type { EquityPoint } from "@/types";

export default function EquityChart({ data }: { data: EquityPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

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

    // Add starting equity point
    const startTime = Math.floor(new Date(data[0].ts).getTime() / 1000) - 86400;
    const points = [
      { time: startTime as number, value: 300 },
      ...data.map(pt => ({
        time: Math.floor(new Date(pt.ts).getTime() / 1000) as number,
        value: pt.equity,
      })),
    ];
    series.setData(points as Parameters<typeof series.setData>[0]);
    chart.timeScale().fitContent();

    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      chart.applyOptions({ width });
    });
    ro.observe(containerRef.current);

    return () => { chart.remove(); ro.disconnect(); };
  }, [data]);

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Equity Curve</h2>
      <div ref={containerRef} />
    </div>
  );
}
