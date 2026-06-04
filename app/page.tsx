import { fetchFileFromGitHub } from "@/lib/github";
import Papa from "papaparse";
import type { Trade, EquityPoint, Portfolio } from "@/types";
import { computeStats, computeMonthlyReturns } from "@/lib/calculations";
import StatsHeader from "@/components/StatsHeader";
import LiveStatus from "@/components/LiveStatus";
import EquityChart from "@/components/EquityChart";
import MonthlyReturns from "@/components/MonthlyReturns";
import TradeHistory from "@/components/TradeHistory";
import PerformanceBreakdown from "@/components/PerformanceBreakdown";

export const dynamic = "force-dynamic";

async function getData() {
  const [tradesRaw, equityRaw, portfolioRaw] = await Promise.all([
    fetchFileFromGitHub("results/live_investment/trades.csv"),
    fetchFileFromGitHub("results/live_investment/equity.csv"),
    fetchFileFromGitHub("results/live_investment/portfolio.json"),
  ]);

  const trades = Papa.parse<Trade>(tradesRaw, {
    header: true,
    dynamicTyping: (col) => col !== "close_ts",
    skipEmptyLines: true,
  }).data.sort((a, b) => new Date(b.close_ts).getTime() - new Date(a.close_ts).getTime());

  const equity = Papa.parse<EquityPoint>(equityRaw, {
    header: true,
    dynamicTyping: (col) => col !== "ts",
    skipEmptyLines: true,
  }).data.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  const portfolio: Portfolio = JSON.parse(portfolioRaw);

  return { trades, equity, portfolio };
}

export default async function Dashboard() {
  const { trades, equity, portfolio } = await getData();
  const stats   = computeStats(trades, equity, portfolio.equity);
  const monthly = computeMonthlyReturns(equity);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Solana Sniper Club</h1>
          <p className="text-slate-400 text-sm mt-0.5">Automated Bybit Futures Bot — Live Performance</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-amber-900/60 border border-amber-700 text-amber-300 text-xs font-semibold tracking-wide">
            DEMO ACCOUNT
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/40 border border-emerald-800 text-emerald-400 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        </div>
      </div>

      {/* Stats bar */}
      <StatsHeader stats={{ ...stats, openTrades: 0 }} />

      {/* Live positions — client component, polls every 30s */}
      <LiveStatus />

      {/* Equity curve */}
      <EquityChart data={equity} />

      {/* Monthly + Breakdown side by side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyReturns data={monthly} />
        <PerformanceBreakdown trades={trades} />
      </div>

      {/* Trade history */}
      <TradeHistory trades={trades} />

      {/* Footer */}
      <footer className="text-center text-xs text-slate-600 py-4 border-t border-surface-border">
        Demo account · All results are simulated with real market prices · Not financial advice
        <span className="mx-2">·</span>
        <a href="https://tradefeecalc.com" target="_blank" rel="noopener noreferrer" className="text-brand-light hover:underline">
          Calculate trading fees →
        </a>
      </footer>
    </main>
  );
}
