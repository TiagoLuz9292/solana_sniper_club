import { NextResponse } from "next/server";
import { getPositions, getWalletBalance } from "@/lib/bybit";

interface BybitPosition {
  size: string;
  symbol: string;
  side: string;
  unrealisedPnl?: string;
  [key: string]: unknown;
}

interface BybitCoin {
  coin: string;
  equity: number;
}

export async function GET() {
  try {
    const [posRes, balRes] = await Promise.all([getPositions(), getWalletBalance()]);

    const positions = ((posRes?.result?.list ?? []) as BybitPosition[]).filter(
      (p) => parseFloat(p.size) > 0
    );

    const coins: BybitCoin[] = balRes?.result?.list?.[0]?.coin ?? [];
    const usdtCoin = coins.find((c) => c.coin === "USDT");
    const walletBalance = usdtCoin?.equity ?? null;

    return NextResponse.json({ positions, walletBalance }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e), positions: [], walletBalance: null }, { status: 500 });
  }
}
