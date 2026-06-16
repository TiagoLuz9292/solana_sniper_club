import { NextResponse } from "next/server";
import { fetchOkxFile } from "@/lib/githubOkx";
import Papa from "papaparse";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const raw = await fetchOkxFile("results/live_investment_sd/equity_sd.csv");
    const { data } = Papa.parse(raw, { header: true, dynamicTyping: true, skipEmptyLines: true });
    const sorted = (data as Record<string, unknown>[]).sort(
      (a, b) => new Date(a.ts as string).getTime() - new Date(b.ts as string).getTime()
    );
    return NextResponse.json(sorted, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
