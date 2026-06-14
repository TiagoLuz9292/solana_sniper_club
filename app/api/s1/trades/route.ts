import { NextResponse } from "next/server";
import { fetchOkxFile } from "@/lib/githubOkx";
import Papa from "papaparse";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const raw = await fetchOkxFile("results/live_investment/trades.csv");
    const { data } = Papa.parse(raw, { header: true, dynamicTyping: true, skipEmptyLines: true });
    const s1trades = (data as any[]).filter((t) => t.system === "S1");
    const sorted = s1trades.sort(
      (a, b) => new Date(b.close_ts).getTime() - new Date(a.close_ts).getTime()
    );
    return NextResponse.json(sorted, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
