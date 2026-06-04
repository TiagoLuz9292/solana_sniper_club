import { NextResponse } from "next/server";
import { fetchFileFromGitHub } from "@/lib/github";

export async function GET() {
  try {
    const raw = await fetchFileFromGitHub("results/live_investment/portfolio.json");
    return NextResponse.json(JSON.parse(raw), {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
