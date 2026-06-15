import { NextResponse } from "next/server";
import { fetchFileFromGitHub } from "@/lib/github";

export const dynamic = "force-dynamic";

// Use market_state.json — updated every 15 min by the combined bot with real Bybit balance.
// market_state_s1.json only updates on S1 trade closes, so it misses ER/VW trade impacts.
export async function GET() {
  try {
    const raw = await fetchFileFromGitHub("results/live_investment/market_state.json");
    return NextResponse.json(JSON.parse(raw), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}
