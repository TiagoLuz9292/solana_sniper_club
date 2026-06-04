import crypto from "crypto";

const BASE_URL    = process.env.BYBIT_BASE_URL!;
const API_KEY     = process.env.BYBIT_API_KEY!;
const API_SECRET  = process.env.BYBIT_API_SECRET!;
const RECV_WINDOW = "5000";

function sign(timestamp: string, params: string): string {
  const payload = timestamp + API_KEY + RECV_WINDOW + params;
  return crypto.createHmac("sha256", API_SECRET).update(payload).digest("hex");
}

async function bybitGet(endpoint: string, params: Record<string, string> = {}) {
  const ts = Date.now().toString();
  const qs = new URLSearchParams(params).toString();
  const sig = sign(ts, qs);

  const res = await fetch(`${BASE_URL}${endpoint}?${qs}`, {
    headers: {
      "X-BAPI-API-KEY":     API_KEY,
      "X-BAPI-TIMESTAMP":   ts,
      "X-BAPI-SIGN":        sig,
      "X-BAPI-RECV-WINDOW": RECV_WINDOW,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) throw new Error(`Bybit ${endpoint} HTTP ${res.status}`);
  return res.json();
}

export async function getWalletBalance() {
  return bybitGet("/v5/account/wallet-balance", {
    accountType: "UNIFIED",
  });
}

export async function getPositions() {
  return bybitGet("/v5/position/list", {
    category: "linear",
    settleCoin: "USDT",
  });
}
