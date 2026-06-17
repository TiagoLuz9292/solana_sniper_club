import { NextResponse } from "next/server";
import { fetchOkxFile } from "@/lib/githubOkx";

export const dynamic = "force-dynamic";

// Reads market_state_sd.json and active_state_sd.json, merges into
// a per-symbol monitor payload compatible with SDMonitor component.
export async function GET() {
  try {
    const [msRaw, asRaw] = await Promise.all([
      fetchOkxFile("results/live_investment_sd/market_state_sd.json").catch(() => "{}"),
      fetchOkxFile("results/live_investment_sd/active_state_sd.json").catch(() => "{}"),
    ]);

    const ms = JSON.parse(msRaw);
    const as_ = JSON.parse(asRaw);
    const sdState: Record<string, unknown> = ms.sd ?? {};

    const result: Record<string, unknown> = { ts: ms.ts };

    for (const [sym, raw] of Object.entries(sdState)) {
      const s = raw as {
        status: string;
        direction: string;
        swept_level: number | null;
        bars_in_state: number;
        atr: number | null;
      };

      const dir = s.direction === "bull" ? "long" : s.direction === "bear" ? "short" : s.direction;
      const at = (as_[sym] as { active_trade?: Record<string, unknown> })?.active_trade;

      // active_state_sd.json is written on every open/close (more timely than market_state_sd.json
      // which only updates every 15-min tick). Override stale WATCHING/PENDING when a trade is live.
      if (at) {
        const atDir = (at.direction as string) === "bull" ? "long" : (at.direction as string) === "bear" ? "short" : (at.direction as string);
        result[sym] = {
          state: "OPEN",
          direction: atDir ?? dir,
          fill_price: at.fill_price ?? 0,
          sl: at.stop_loss ?? 0,
          tp: at.take_profit ?? 0,
          atr: s.atr,
        };
      } else if (s.status === "IDLE") {
        result[sym] = { state: "IDLE", atr: s.atr };
      } else if (s.status === "WATCHING") {
        result[sym] = {
          state: "WATCHING",
          direction: dir,
          swept_level: s.swept_level,
          bars_watched: s.bars_in_state,
          max_watch: 4,
          atr: s.atr,
        };
      } else if (s.status === "PENDING") {
        result[sym] = {
          state: "PENDING",
          direction: dir,
          level: s.swept_level,
          bars_since_order: s.bars_in_state,
          max_fill: 4,
          atr: s.atr,
        };
      } else if (s.status === "OPEN") {
        result[sym] = {
          state: "OPEN",
          direction: dir,
          fill_price: at?.fill_price ?? 0,
          sl: at?.stop_loss ?? 0,
          tp: at?.take_profit ?? 0,
          atr: s.atr,
        };
      }
    }

    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}
