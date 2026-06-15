import { NextResponse } from "next/server";
import { fetchFileFromGitHub } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const raw = await fetchFileFromGitHub("results/live_investment/events.jsonl");
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
