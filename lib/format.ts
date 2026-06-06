/**
 * Format a price with the minimum decimals needed for its magnitude,
 * stripping trailing zeros.
 *
 * BTC/ETH  (≥1000) → 2 dp   e.g. 1679.73
 * SOL/BNB  (≥10)   → 3 dp   e.g. 65.55, 66.628
 * XRP/ADA  (≥1)    → 4 dp   e.g. 1.1364, 1.1473
 * DOGE     (≥0.01) → 5 dp   e.g. 0.08420
 * sub-cent          → 6 dp
 */
export function fmtPrice(price: number): string {
  const dp =
    price >= 1000 ? 2 :
    price >= 10   ? 3 :
    price >= 1    ? 4 :
    price >= 0.01 ? 5 : 6;
  return price.toFixed(dp).replace(/\.?0+$/, "");
}
