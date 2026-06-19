import { NextResponse } from "next/server";
import { fetchOkxFile } from "@/lib/githubOkx";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const raw = await fetchOkxFile("results/live_investment_sha/events.jsonl");
    const events = raw
      .trim()
      .split("\n")
      .filter(Boolean)
      .flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } })
      .reverse();
    return NextResponse.json(events, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
