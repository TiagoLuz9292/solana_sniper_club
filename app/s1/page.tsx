import { fetchOkxFile } from "@/lib/githubOkx";
import Papa from "papaparse";
import type { Trade, EquityPoint } from "@/types";
import { computeStats, computeMonthlyReturns } from "@/lib/calculations";
import TabNav from "@/components/TabNav";
import StatsHeader from "@/components/StatsHeader";
import LiveStatus from "@/components/LiveStatus";
import EventsFeed from "@/components/EventsFeed";
import EquityChart from "@/components/EquityChart";
import MonthlyReturns from "@/components/MonthlyReturns";
import TradeHistory from "@/components/TradeHistory";
import PerformanceBreakdown from "@/components/PerformanceBreakdown";

export const dynamic = "force-dynamic";

async function getData() {
  const [tradesRaw, equityRaw, activeRaw, marketRaw] = await Promise.all([
    fetchOkxFile("results/live_investment/trades.csv").catch(() => ""),
    fetchOkxFile("results/live_investment/equity_s1.csv").catch(() => ""),
    fetchOkxFile("results/live_investment/active_state_s1.json").catch(() => "{}"),
    fetchOkxFile("results/live_investment/market_state_s1.json").catch(() => "{}"),
  ]);

  const allTrades: Trade[] = tradesRaw
    ? Papa.parse<Trade>(tradesRaw, {
        header: true,
        dynamicTyping: (col) => col !== "close_ts",
        skipEmptyLines: true,
      }).data
    : [];

  const trades = allTrades
    .filter((t) => t.system === "S1")
    .sort((a, b) => new Date(b.close_ts).getTime() - new Date(a.close_ts).getTime());

  const equity: EquityPoint[] = equityRaw
    ? Papa.parse<EquityPoint>(equityRaw, {
        header: true,
        dynamicTyping: (col) => col !== "ts",
        skipEmptyLines: true,
      }).data.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
    : [];

  const activeState = JSON.parse(activeRaw);
  const marketState = JSON.parse(marketRaw);

  const currentEquity: number =
    marketState.equity ??
    (equity.length > 0 ? equity[equity.length - 1].equity : 0);

  // Starting equity = account balance when S1 first launched (first row of equity_s1.csv)
  const startingEquity: number =
    equity.length > 0 ? equity[0].equity : currentEquity;

  const openTrades = Object.values(activeState).filter(
    (v) => !!(v as { active_trade?: unknown }).active_trade
  ).length;

  return { trades, equity, currentEquity, startingEquity, openTrades };
}

export default async function S1Dashboard() {
  const { trades, equity, currentEquity, startingEquity, openTrades } = await getData();
  const stats   = computeStats(trades, equity, currentEquity, startingEquity);
  const monthly = computeMonthlyReturns(equity);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Solana Sniper Club</h1>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-yellow-900/60 border border-yellow-700 text-yellow-300 text-xs font-semibold tracking-wide">
              BYBIT DEMO
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-900/40 border border-emerald-800 text-emerald-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>
        </div>
        <p className="text-slate-400 text-sm">
          S1 Liquidity Sweep System — Bybit Demo Account
        </p>
      </div>

      {/* Tab navigation */}
      <TabNav />

      {/* Stats bar */}
      <StatsHeader
        stats={{ ...stats, openTrades }}
        activeApiPath="/api/s1/active"
        marketStateApiPath="/api/s1/market-state"
      />

      {/* Open trades */}
      <LiveStatus activeApiPath="/api/s1/active" />

      {/* Equity curve + Events feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <EquityChart data={equity} trades={trades} currentEquity={currentEquity} startingEquity={startingEquity} />
        <EventsFeed apiPath="/api/s1/events" />
      </div>

      {/* Monthly + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <PerformanceBreakdown trades={trades} />
        </div>
        <MonthlyReturns data={monthly} />
      </div>

      {/* Trade history */}
      <TradeHistory trades={trades} />

      {/* Footer */}
      <footer className="text-center text-xs text-slate-600 py-4 border-t border-surface-border">
        Bybit demo account · S1 Liquidity Sweep system · Not financial advice
      </footer>
    </main>
  );
}
