import { NextResponse } from "next/server";
import { fetchFileFromGitHub } from "@/lib/github";

export async function GET() {
  try {
    const raw = await fetchFileFromGitHub("results/live_investment/events.jsonl");
    const events = raw
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l))
      .reverse();
    return NextResponse.json(events, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
