import { NextResponse } from "next/server";
import { fetchOkxFile } from "@/lib/githubOkx";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const raw = await fetchOkxFile("results/live_investment_sd/active_state_sd.json");
    const data = JSON.parse(raw);
    // Normalise direction: bot uses "bull"/"bear", LiveStatus expects "long"/"short"
    for (const entry of Object.values(data) as Record<string, unknown>[]) {
      const at = (entry as { active_trade?: Record<string, unknown> }).active_trade;
      if (at && typeof at.direction === "string") {
        at.direction = at.direction === "bull" ? "long" : at.direction === "bear" ? "short" : at.direction;
      }
    }
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}
