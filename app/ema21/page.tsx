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
    fetchOkxFile("results/live_investment_ema21/trades.csv").catch(() => ""),
    fetchOkxFile("results/live_investment_ema21/equity_ema21.csv").catch(() => ""),
    fetchOkxFile("results/live_investment_ema21/active_state_ema21.json").catch(() => "{}"),
    fetchOkxFile("results/live_investment_ema21/market_state_ema21.json").catch(() => "{}"),
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

export default async function EMA21Dashboard() {
  const { trades, equity, currentEquity, startingEquity, openTrades } = await getData();
  const stats   = computeStats(trades, equity, currentEquity, startingEquity);
  const monthly = computeMonthlyReturns(equity);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-white">EMA Reclaim + Retest — EMA21</h1>
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
          Price was above/below EMA21, violates it, shows resistance and reclaims (closes back on
          trend side), then a limit order retests EMA21 for entry · sl=0.5×ATR · tp=2R
        </p>
        <p className="text-xs text-slate-500">
          Risk sizing: <span className="text-slate-300 font-medium">0.097% of equity per trade</span> —
          the smaller of (a) target max 15% historical drawdown at backtest DD=154.2R, and
          (b) capping a worst-case day (all ~9.4 trades/day losing) at 3% of equity. Backtest:
          n=17,599 · EV=+0.360R · WR=58.1% · PF=1.62 · 6/6 years positive (2021–2026, all 6 symbols).
        </p>
      </div>

      <TabNav />

      <StatsHeader
        stats={{ ...stats, openTrades }}
        activeApiPath="/api/ema21/active"
        marketStateApiPath="/api/ema21/market-state"
      />

      <LiveStatus activeApiPath="/api/ema21/active" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <EquityChart data={equity} trades={trades} currentEquity={currentEquity} startingEquity={startingEquity} />
        <EventsFeed apiPath="/api/ema21/events" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <PerformanceBreakdown trades={trades} />
        </div>
        <MonthlyReturns data={monthly} />
      </div>

      <TradeHistory trades={trades} apiPath="/api/ema21/trades" />

      <footer className="text-center text-xs text-slate-600 py-4 border-t border-surface-border">
        Bybit demo account · EMA Reclaim + Retest (EMA21) · Not financial advice
      </footer>
    </main>
  );
}
