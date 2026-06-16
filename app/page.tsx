import { redirect } from "next/navigation";
import { FaYoutube, FaXTwitter, FaTiktok } from "react-icons/fa6";
import { fetchFileFromGitHub } from "@/lib/github";
import Papa from "papaparse";
import type { Trade, EquityPoint, Portfolio } from "@/types";
import { computeStats, computeMonthlyReturns } from "@/lib/calculations";
import TabNav from "@/components/TabNav";
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
  const openTrades = Object.values(activeState).filter((v) => !!v.active_trade).length;

  return { trades, equity, currentEquity, openTrades };
}

export default function Dashboard() {
  // S1-only era: root redirects to the S1 tab (ER+VW bot archived 2026-06-16)
  redirect("/s1");
}
