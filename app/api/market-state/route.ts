import { NextResponse } from "next/server";
import { fetchFileFromGitHub } from "@/lib/github";

export async function GET() {
  try {
    const raw = await fetchFileFromGitHub("results/live_investment/market_state.json");
    return NextResponse.json(JSON.parse(raw), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
