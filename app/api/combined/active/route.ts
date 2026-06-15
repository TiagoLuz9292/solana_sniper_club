import { NextResponse } from "next/server";
import { fetchFileFromGitHub } from "@/lib/github";
import { fetchOkxFile } from "@/lib/githubOkx";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [rawErVw, rawS1] = await Promise.allSettled([
      fetchFileFromGitHub("results/live_investment/active_state.json"),
      fetchOkxFile("results/live_investment/active_state_s1.json"),
    ]);

    const erVw = rawErVw.status === "fulfilled" ? JSON.parse(rawErVw.value) : {};
    const s1   = rawS1.status   === "fulfilled" ? JSON.parse(rawS1.value)   : {};

    return NextResponse.json({ ...erVw, ...s1 }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}
