import { fetchFileFromGitHub } from "@/lib/github";
import Papa from "papaparse";
import type { Trade, EquityPoint, Portfolio } from "@/types";
import { computeStats, computeMonthlyReturns } from "@/lib/calculations";
import StatsHeader from "@/components/StatsHeader";
import LiveStatus from "@/components/LiveStatus";
import EventsFeed from "@/components/EventsFeed";
import MarketState from "@/components/MarketState";
import EquityChart from "@/components/EquityChart";
import MonthlyReturns from "@/components/MonthlyReturns";
import TradeHistory from "@/components/TradeHistory";
import PerformanceBreakdown from "@/components/PerformanceBreakdown";

export const dynamic = "force-dynamic";

async function getData() {
  const [tradesRaw, equityRaw, portfolioRaw, activeRaw, marketStateRaw] = await Promise.all([
    fetchFileFromGitHub("results/live_investment/trades.csv"),
    fetchFileFromGitHub("results/live_investment/equity.csv"),
    fetchFileFromGitHub("results/live_investment/portfolio.json"),
    fetchFileFromGitHub("results/live_investment/active_state.json").catch(() => "{}"),
    fetchFileFromGitHub("results/live_investment/market_state.json").catch(() => "{}"),
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
  const marketState = JSON.parse(marketStateRaw);
  const currentEquity: number = marketState.equity ?? portfolio.equity;

  const activeState = JSON.parse(activeRaw) as Record<string, { active_trade: unknown }>;
  const openTrades = Object.values(activeState).filter((v) => v.active_trade !== null).length;

  return { trades, equity, currentEquity, openTrades };
}

export default async function Dashboard() {
  const { trades, equity, currentEquity, openTrades } = await getData();
  const stats   = computeStats(trades, equity, currentEquity);
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
      <StatsHeader stats={{ ...stats, openTrades }} />

      {/* Open trades — full width, thin horizontal cards */}
      <LiveStatus />

      {/* Equity curve + Events feed side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <EquityChart data={equity} trades={trades} currentEquity={currentEquity} />
        <EventsFeed />
      </div>

      {/* Market state */}
      <MarketState />

      {/* Monthly + Breakdown side by side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <PerformanceBreakdown trades={trades} />
        </div>
        <MonthlyReturns data={monthly} />
      </div>

      {/* Trade history */}
      <TradeHistory trades={trades} />

      {/* Footer */}
      <footer className="text-center text-xs text-slate-600 py-4 border-t border-surface-border space-y-1">
        <div>Demo account · All results are simulated with real market prices · Not financial advice</div>
        <div className="flex justify-center gap-4">
          <a href="https://tradefeecalc.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">tradefeecalc.com</a>
          <a href="https://www.youtube.com/@SolanaSniperClub" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">YouTube</a>
          <a href="https://twitter.com/sol_sniper_club" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">@sol_sniper_club</a>
        </div>
      </footer>
    </main>
  );
}
