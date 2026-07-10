import { NextResponse } from "next/server";
import { fetchOkxFile } from "@/lib/githubOkx";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const raw = await fetchOkxFile("results/live_investment_ema21/active_state_ema21.json");
    return NextResponse.json(JSON.parse(raw), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}
