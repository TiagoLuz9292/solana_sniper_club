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
import ERVWMonitor from "@/components/ERVWMonitor";

export const revalidate = 15;

async function getData() {
  const [tradesRaw, equityRaw, activeRaw, marketRaw] = await Promise.all([
    fetchOkxFile("results/live_investment_er_vw/trades.csv").catch(() => ""),
    fetchOkxFile("results/live_investment_er_vw/equity_er_vw.csv").catch(() => ""),
    fetchOkxFile("results/live_investment_er_vw/active_state_er_vw.json").catch(() => "{}"),
    fetchOkxFile("results/live_investment_er_vw/market_state_er_vw.json").catch(() => "{}"),
  ]);

  const trades: Trade[] = tradesRaw
    ? Papa.parse<Trade>(tradesRaw, {
        header: true,
        dynamicTyping: (col) => col !== "close_ts",
        skipEmptyLines: true,
      }).data.sort((a, b) => new Date(b.close_ts).getTime() - new Date(a.close_ts).getTime())
    : [];

  const equity: EquityPoint[] = equityRaw
    ? Papa.parse<EquityPoint>(equityRaw, {
        header: true,
        dynamicTyping: (col) => col !== "ts",
        skipEmptyLines: true,
      }).data.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
    : [];

  const activeState = JSON.parse(activeRaw);
  const marketState = JSON.parse(marketRaw);

  const rawEquity =
    marketState.equity ??
    (equity.length > 0 ? equity[equity.length - 1].equity : null);
  const currentEquity: number =
    rawEquity != null && isFinite(rawEquity) ? rawEquity : 0;

  const rawStart = equity.length > 0 ? equity[0].equity : null;
  const startingEquity: number =
    rawStart != null && isFinite(rawStart) && rawStart > 0 ? rawStart : currentEquity || 500;

  const openTrades = Object.values(activeState).filter(
    (v) => !!(v as { active_trade?: unknown }).active_trade
  ).length;

  return { trades, equity, currentEquity, startingEquity, openTrades };
}

export default async function ERVWDashboard() {
  const { trades, equity, currentEquity, startingEquity, openTrades } = await getData();
  const stats   = computeStats(trades, equity, currentEquity, startingEquity);
  const monthly = computeMonthlyReturns(equity);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-white">ER + VW — EMA Ribbon + VWAP, HTF-aligned</h1>
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
        <p className="text-xs text-slate-500">
          Two systems sharing one account: ER (5-EMA ribbon pullback, ETH/SOL/ADA/DOGE, 3-4R TP)
          and VW (VWAP wick-touch, all 6 symbols, 1.5-2.5R TP), both gated on 3-timeframe (1h/2h/4h)
          HTF alignment. Only one of ER/VW may hold a position on a given symbol at a time.
          Risk: per-symbol 0.88-1.20% of equity, throttled to 5/8 or 3/8 at 85%/75% of peak equity
          (full restore at 95% of peak). Re-validated 2026-07-12: full 2021-2026 backtest, 10 random
          2-3mo periods, a 20-quarter block-bootstrap simulating 4 years live, and a concurrency
          sensitivity grid — all profitable, mean EV +0.26R/trade, 14/16 positive quarters.
        </p>
      </div>

      <TabNav />

      <StatsHeader
        stats={{ ...stats, openTrades }}
        activeApiPath="/api/er-vw/active"
        marketStateApiPath="/api/er-vw/market-state"
      />

      <LiveStatus activeApiPath="/api/er-vw/active" />

      <ERVWMonitor apiPath="/api/er-vw/monitor" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <EquityChart data={equity} trades={trades} currentEquity={currentEquity} startingEquity={startingEquity} />
        <EventsFeed apiPath="/api/er-vw/events" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <PerformanceBreakdown trades={trades} />
        </div>
        <MonthlyReturns data={monthly} />
      </div>

      <TradeHistory trades={trades} apiPath="/api/er-vw/trades" />

      <footer className="text-center text-xs text-slate-600 py-4 border-t border-surface-border">
        Bybit demo account · ER (EMA Ribbon) + VW (VWAP Touch), HTF-aligned · Not financial advice
      </footer>
    </main>
  );
}
