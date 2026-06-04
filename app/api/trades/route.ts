import { NextResponse } from "next/server";
import Papa from "papaparse";
import { fetchFileFromGitHub } from "@/lib/github";
import type { Trade } from "@/types";

export async function GET() {
  try {
    const csv = await fetchFileFromGitHub("results/live_investment/trades.csv");
    const { data } = Papa.parse<Trade>(csv, { header: true, dynamicTyping: true, skipEmptyLines: true });
    const sorted = [...data].sort(
      (a, b) => new Date(b.close_ts).getTime() - new Date(a.close_ts).getTime()
    );
    return NextResponse.json(sorted, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
