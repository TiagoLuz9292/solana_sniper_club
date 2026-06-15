import { NextResponse } from "next/server";
import { fetchOkxFile } from "@/lib/githubOkx";

export const dynamic = "force-dynamic";

// Combined tab uses S1 market state — the currently active bot.
// When ER+VW+S1 combined bot launches, this will be updated to its file.
export async function GET() {
  try {
    const raw = await fetchOkxFile("results/live_investment/market_state_s1.json");
    return NextResponse.json(JSON.parse(raw), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}
