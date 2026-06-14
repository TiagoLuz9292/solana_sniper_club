import { NextResponse } from "next/server";
import { fetchOkxFile } from "@/lib/githubOkx";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const raw = await fetchOkxFile("results/live_investment/events.jsonl");
    const events = raw
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l))
      .filter((e) => e.system === "S1")
      .reverse();
    return NextResponse.json(events, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
