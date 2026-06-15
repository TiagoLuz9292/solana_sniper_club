import { fetchFileFromGitHub } from "@/lib/github";
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

const COMBINED_START_EQUITY = 300;

async function getData() {
  const [tradesRaw, erVwEquityRaw, s1EquityRaw, erVwActiveRaw, s1ActiveRaw, marketRaw] =
    await Promise.all([
      fetchFileFromGitHub("results/live_investment/trades.csv").catch(() => ""),
      fetchFileFromGitHub("results/live_investment/equity.csv").catch(() => ""),
      fetchOkxFile("results/live_investment/equity_s1.csv").catch(() => ""),
      fetchFileFromGitHub("results/live_investment/active_state.json").catch(() => "{}"),
      fetchOkxFile("results/live_investment/active_state_s1.json").catch(() => "{}"),
      fetchOkxFile("results/live_investment/market_state_s1.json").catch(() => "{}"),
    ]);

  // All trades — ER + VW + S1 combined
  const trades: Trade[] = tradesRaw
    ? Papa.parse<Trade>(tradesRaw, {
        header: true,
        dynamicTyping: (col) => col !== "close_ts",
        skipEmptyLines: true,
      }).data.sort((a, b) => new Date(b.close_ts).getTime() - new Date(a.close_ts).getTime())
    : [];

  // Merge ER+VW and S1 equity curves chronologically — they share the same account
  // ER+VW ran first (starts ~$300), S1 picked up after ER+VW stopped (~$440)
  const parseEquity = (raw: string): EquityPoint[] =>
    raw
      ? Papa.parse<EquityPoint>(raw, {
          header: true,
          dynamicTyping: (col) => col !== "ts",
          skipEmptyLines: true,
        }).data
      : [];

  const equity: EquityPoint[] = [
    ...parseEquity(erVwEquityRaw),
    ...parseEquity(s1EquityRaw),
  ].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  // Deduplicate exact same timestamp+equity (equity_s1 initial row may overlap equity.csv end)
  const seen = new Set<string>();
  const dedupedEquity = equity.filter((pt) => {
    const key = `${pt.ts}:${pt.equity}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Merge active states
  const erVwActive = JSON.parse(erVwActiveRaw);
  const s1Active   = JSON.parse(s1ActiveRaw);
  const activeState = { ...erVwActive, ...s1Active };
  const openTrades  = Object.values(activeState).filter(
    (v) => !!(v as { active_trade?: unknown }).active_trade
  ).length;

  // Current equity from the currently-running bot (S1 / future combined)
  const marketState = JSON.parse(marketRaw);
  const rawEquity =
    marketState.equity ??
    (dedupedEquity.length > 0 ? dedupedEquity[dedupedEquity.length - 1].equity : null);
  const currentEquity: number =
    rawEquity != null && isFinite(rawEquity) ? rawEquity : COMBINED_START_EQUITY;

  return { trades, equity: dedupedEquity, currentEquity, openTrades };
}

export default async function CombinedDashboard() {
  const { trades, equity, currentEquity, openTrades } = await getData();
  const stats   = computeStats(trades, equity, currentEquity, COMBINED_START_EQUITY);
  const monthly = computeMonthlyReturns(equity);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">

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
          All Systems — ER + VW + S1 Combined · Bybit Demo Account
        </p>
      </div>

      <TabNav />

      <StatsHeader
        stats={{ ...stats, openTrades }}
        activeApiPath="/api/combined/active"
        marketStateApiPath="/api/combined/market-state"
      />

      <LiveStatus activeApiPath="/api/combined/active" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <EquityChart
          data={equity}
          trades={trades}
          currentEquity={currentEquity}
          startingEquity={COMBINED_START_EQUITY}
        />
        <EventsFeed apiPath="/api/events" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <PerformanceBreakdown trades={trades} />
        </div>
        <MonthlyReturns data={monthly} />
      </div>

      <TradeHistory trades={trades} />

      <footer className="text-center text-xs text-slate-600 py-4 border-t border-surface-border">
        Bybit demo account · ER + VW + S1 combined · Not financial advice
      </footer>
    </main>
  );
}
