# S1 Liquidity Sweep — System Edge Reference

**CRITICAL: Read this before touching any S1 backtest or live bot code.**  
This is the single source of truth for the S1 trading system. Every parameter, every state transition, every invariant is documented here and backed by a 5-year backtest (2021–2026). Do not change anything without re-running the backtest and updating this document.

---

## 1. What Happened — Discovery History (June 16, 2026)

### The Problem: Lookahead Bias in the Original System

The original S1 backtest (backtest_s1_liq_sweep.py, `simulate()` in simulator.py) showed EV=+0.196R, PF=1.31 across 25,047 trades from 2021–2026. This result was **not achievable in live trading** due to a lookahead bias in the entry filter.

**The bias:** After a sweep candle, a limit order was placed at the swept level immediately. To accept or reject the fill, the simulator checked whether `bar close > swept_level` (for longs). But this "close" is the close of the SAME bar that filled the limit — information that doesn't exist until AFTER the limit would have been filled intra-bar. In live trading, a limit order fills as soon as price touches it; you cannot know where the bar will close at that moment.

**The proof:** Removing the filter (taking all fills unconditionally) collapsed EV to −0.261R across 48,049 trades. The filter was creating the entire edge — but through future information.

### The Solution: Retest + Confirmation Entry

A new entry model was designed that has **zero lookahead** and is **100% replicable in live trading**:

1. Sweep candle detected at bar k → enter WATCHING state (no order placed)
2. Watch subsequent bars for a **confirmation bar**: a bar that BOTH touches the swept level (wick into it) AND closes on the correct side (proving the level held)
3. After confirmation bar closes (full OHLC known, no future info needed) → place limit order at swept level
4. Wait for a third touch to fill the limit

The bot runs at candle close +30s. It sees full confirmed OHLC before any action. No lookahead possible.

### Backtest Validation

The new system was backtested over 2021–2026 on the same data:
- **EV=+0.179R post-fee** (vs biased +0.196R — drop is modest for eliminating all lookahead)
- **All 6 years profitable** (posYrs=6/6) for the live symbols
- **MaxDD reduced**: 37.5R vs 62R original (fewer but higher-quality trades)
- Trade count: ~10,000 total across 5 symbols (vs 25,000 in biased version — 62% fewer, 37% fill rate)

---

## 2. System Logic: State Machine

```
IDLE ──[sweep detected on bar k]──► WATCHING
WATCHING ──[confirmation bar found]──► PENDING  (place limit at swept_level)
WATCHING ──[close breaks through level OR max_watch_bars exceeded]──► IDLE
PENDING ──[order filled]──► OPEN
PENDING ──[close breaks through level OR max_fill_bars exceeded]──► IDLE (cancel order)
OPEN ──[SL or TP hit]──► IDLE
```

### Phase 1: Sweep Detection (IDLE → WATCHING)

**Trigger (on bar k close):**
- Bull sweep: `low < swing_low AND close > swing_low AND |close−open| ≥ 0.3×ATR`
- Bear sweep: `high > swing_high AND close < swing_high AND |close−open| ≥ 0.3×ATR`
- `swing_low/high` = min/max of the prior 10 bar lows/highs (rolling, bars k−10 to k−1)

**On trigger:** Store `swept_level`, set `bars_watched = 0`, enter WATCHING.  
**No order is placed.** The bot only watches.

### Phase 2: Confirmation (WATCHING → PENDING)

Called on each subsequent tick (bar M close). `bars_watched` increments by 1 per tick.

**Confirmation bar (bull):** `low ≤ swept_level AND close > swept_level`  
**Confirmation bar (bear):** `high ≥ swept_level AND close < swept_level`

**On confirmation:** Place limit order at `swept_level`. Enter PENDING.

**Invalidation (bull):** `close < swept_level` → level failed, IDLE  
**Invalidation (bear):** `close > swept_level` → level failed, IDLE  
**Expiry:** `bars_watched > MAX_WATCH_BARS (4)` → IDLE

**Why this is critical:** The confirmation bar's full OHLC is known BEFORE placing the order. No lookahead. The bot places the limit at the NEXT tick's order submission window.

### Phase 3: Fill (PENDING → OPEN)

Standard limit order tracking. ATR at confirmation bar is used to set SL.

**Fill (bull):** `low ≤ swept_level` → filled at `swept_level`  
**Fill (bear):** `high ≥ swept_level` → filled at `swept_level`  
**Invalidation (bull):** `close < swept_level` → cancel order, IDLE  
**Invalidation (bear):** `close > swept_level` → cancel order, IDLE  
**Expiry:** `bars_since_order > MAX_FILL_BARS (4)` → cancel, IDLE

### Phase 4: Trade Management (OPEN → IDLE)

SL and TP are set on the exchange (Bybit limit/stop orders). Bot monitors position.  
SL = `swept_level ± SL_ATR_MULT × ATR_at_confirmation`  
TP = `entry ± TP_R × risk`  
Outcome recorded via Bybit closed PnL API.

---

## 3. Validated Parameters

| Parameter | Value | Notes |
|-----------|-------|-------|
| `swing_n` | 10 | Rolling bars for swing high/low detection |
| `body_min_atr` | 0.3 | Min candle body as fraction of ATR (filters wicks) |
| `sl_atr_mult` | 1.0 | SL distance = 1×ATR beyond swept level |
| `tp_r` | 2.0 | Fixed TP at 2R from entry |
| `max_watch_bars` | 4 | Max bars to find confirmation after sweep |
| `max_fill_bars` | 4 | Max bars to fill limit after confirmation |
| `min_conf_gap_bars` | 1 | Min bars between sweep and confirmation — filters immediate next-bar noise |
| `risk_pct` | 0.01 | 1% of balance per trade (live bot) |
| `leverage` | 10× | Fixed leverage on Bybit demo |
| `atr_period` | 14 | EWM ATR, same formula in backtest and live |

**Do not change these without re-running the full 2021–2026 backtest.**

---

## 4. Symbols Traded

| Symbol | Included | Reason |
|--------|----------|--------|
| ETHUSDT | ✅ | EV=+0.148R, PF=1.22, posYrs=6/6 |
| SOLUSDT | ✅ | EV=+0.304R, PF=1.52, posYrs=6/6 — strongest |
| ADAUSDT | ✅ | EV=+0.213R, PF=1.34, posYrs=6/6 |
| XRPUSDT | ✅ | EV=+0.191R, PF=1.30, posYrs=6/6 |
| DOGEUSDT | ✅ | EV=+0.205R, PF=1.33, posYrs=6/6 |
| BTCUSDT | ❌ | EV=+0.089R only — dilutes portfolio; dropped Jun 16 2026 |

**BTC was removed on June 16, 2026.** Its EV (+0.089R) is less than half the average of the other symbols (+0.197R combined). It adds MaxDD without proportional edge.

---

## 5. Backtest Results (2021–2026, post-fee, 5 symbols)

### Per-Symbol

| Symbol | n | WR | EV/trade | PF | Total R | MaxDD | posYrs |
|--------|---|-----|----------|-----|---------|-------|--------|
| ETH | 1,285 | 45.0% | +0.148R | 1.22 | +189.6R | 33.2R | 6/6 |
| SOL | 1,227 | 47.9% | +0.304R | 1.52 | +373.2R | 17.1R | 6/6 |
| ADA | 1,326 | 45.4% | +0.213R | 1.34 | +281.8R | 16.9R | 6/6 |
| XRP | 1,209 | 45.7% | +0.191R | 1.30 | +231.1R | 26.8R | 6/6 |
| DOGE | 1,247 | 45.3% | +0.205R | 1.33 | +256.2R | 32.1R | 6/6 |
| **TOTAL** | **6,294** | **45.8%** | **+0.212R** | **~1.34** | **+1,331.9R** | — | **6/6** |

### Yearly Total R (all 5 symbols combined)

| Year | Total R | Profitable? |
|------|---------|-------------|
| 2021 | +137.7R | ✅ |
| 2022 | +252.8R | ✅ |
| 2023 | +114.5R | ✅ |
| 2024 | +326.5R | ✅ |
| 2025 | +367.6R | ✅ |
| 2026 (Jan–Jun) | +132.7R | ✅ |

**Every single year profitable.** No losing year across 5.5 years of data.

### Entry Funnel (gap=1 params, 5 symbols)

With `min_conf_gap_bars=1`, the immediate next-bar confirmation is skipped. This removes the weakest confirmations (same-bar noise) and is reflected in the higher EV.

| Stage | Count | % of prior |
|-------|-------|-----------|
| Sweeps detected | 67,041 | — |
| Confirmation accepted (gap ≥ 1 bar) | ~18,000 | ~27% of sweeps |
| Filled (third touch) | 6,294 | ~35% of confirmations |

35% of accepted confirmations fill. 65% expire or are invalidated — expected and built into the EV.

### Equity Simulation ($1,000 start, 0.5% risk/trade, simultaneous across all 5 symbols)

| Year | Equity | Return | Trades |
|------|--------|--------|--------|
| Start 2021 | $1,000 | — | — |
| End 2021 | $1,959 | +95.9% | 509 |
| End 2022 | $6,693 | +241.6% | 1,128 |
| End 2023 | $11,429 | +70.8% | 1,246 |
| End 2024 | $55,956 | +389.6% | 1,348 |
| End 2025 | $335,114 | +498.9% | 1,431 |
| Jun 2026 | $635,853 | +89.7% | 632 |

**Worst drawdown: −20.3%** (with 0.5% risk/trade, no daily DD limit)  
**~3.3 trades/day total** across 5 symbols (~0.65 trades/day per symbol)  

Note: the equity sim terminal value is lower than the gap=0 version because gap=1 takes 25% fewer trades. However EV per trade is higher (+0.212R vs +0.197R), and all years remain profitable.

---

## 6. Implementation Files

### Backtest
- **Simulator:** `backtesting/systems/liq_sweep/simulator_retest.py` — retest logic, zero lookahead
- **Backtest runner:** `backtesting/backtest_s1_retest.py` — 7 variants across all symbols
- **Detail analysis:** `backtesting/analyse_s1_retest_detail.py` — per-symbol + equity sim
- **Funnel diagnostic:** `backtesting/diagnostic_s1_retest.py` — entry funnel + miss depth

### Live Bot (VPS: `/opt/trd/bybit_s1_runner/`)
- **State machine:** `systems/s1_liq_sweep.py` — IDLE → WATCHING → PENDING → OPEN
- **Main loop:** `main.py` — 5 symbols (no BTC), 15m candles

---

## 7. Critical Implementation Invariants

These are non-negotiable. Any deviation breaks the live/backtest equivalence.

1. **Confirmation bar cannot fill on the same tick it is discovered.**  
   In the backtest (`simulator_retest.py`), new confirmations go to `new_pending` and are appended to `pending` AFTER the pending loop runs — preventing same-bar fills.  
   In the live bot, the order is placed AFTER the confirmation bar closes; Bybit order submission is a separate API call made at the next tick opportunity.

2. **ATR used for SL = ATR at the confirmation bar, not the fill bar.**  
   `atr_conf` is captured when the confirmation is found and frozen for SL calculation. This is what the backtest does.

3. **Both phases use the same invalidation rule:** close below swept_level (bull) or above (bear). No exceptions.

4. **Max 1 trade per symbol at a time.** A symbol in WATCHING, PENDING, or OPEN cannot take a new setup.

5. **Limit price = exactly `swept_level`** — the original swing high/low that was swept. Not ATR-adjusted. Not rounded until Bybit tick size rounding.

6. **Sweep detection uses rolling N-bar min/max of PRIOR bars** (not including the sweep bar itself):  
   `swing_low = min(low for last SWING_N bars before sweep bar)`

7. **Confirmation bar cannot be the immediate next bar after the sweep (`min_conf_gap_bars=1`).**  
   The bar directly after the sweep is skipped as a potential confirmation — it's treated as gap/breathing-room time. Confirmation is only accepted from bar 2 onwards. Invalidation (close through level) is still checked on gap bars. Grid search confirmed: gap=1 raises EV from +0.197R to +0.212R at a cost of 25% fewer trades.

7. **Bot restart recovery:** Cancel any orphaned pending limit orders on restart (implemented since June 16 fix). Recover open positions normally.

---

## 8. What NOT to Change Without Full Re-Backtest

- `swing_n`, `body_min_atr`, `sl_atr_mult`, `tp_r` — core signal and R parameters
- `max_watch_bars`, `max_fill_bars` — timing windows
- Invalidation logic (close through level) — load-bearing edge creation mechanism
- Symbol list — BTC deliberately excluded

Safe to adjust without re-backtest:
- `risk_pct` — only affects position sizing, not trade selection
- `leverage` — only affects notional, not trade selection
- Log message text

### Gap Filter — Research Log (June 16, 2026)

A 15-variant grid search tested `min_sweep_wick_atr` ∈ {0, 0.1, 0.2, 0.3, 0.5} × `min_conf_gap_bars` ∈ {0, 1, 2}. Key findings:

- **Wick filter hurts EV**: requiring a larger wick on the sweep bar degrades performance at every threshold. The body filter (0.3×ATR) is sufficient quality control.
- **Gap=1 is the only improvement**: +0.015R EV gain (−25% trades). Gap=2 adds only +0.002R for another −16% trades.
- **`min_conf_gap_bars=1` adopted** as the new validated parameter. All numbers in this document reflect gap=1.

---

## 9. Data Reset History

| Date | Event |
|------|-------|
| 2026-06-16 ~08:33 UTC | First reset — $500 balance. Ran original (biased) system unknowingly. 7 trades recorded. |
| 2026-06-16 (evening) | Lookahead bias discovered, system rebuilt. Second reset — ~$500 balance. Retest system goes live. |

All pre-reset data is archived on VPS at:  
`/opt/trd/bybit_trading_bot/results/archive/`
