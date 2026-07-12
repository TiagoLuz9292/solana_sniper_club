import { NextResponse } from "next/server";
import { fetchOkxFile } from "@/lib/githubOkx";
import Papa from "papaparse";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const raw = await fetchOkxFile("results/live_investment_er_vw/equity_er_vw.csv");
    const { data } = Papa.parse(raw, { header: true, dynamicTyping: true, skipEmptyLines: true });
    const sorted = (data as any[]).sort(
      (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
    );
    return NextResponse.json(sorted, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
