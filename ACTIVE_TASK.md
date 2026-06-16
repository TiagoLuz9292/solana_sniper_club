# Active Task — S1-Only System (Clean Start)

**Last updated:** 2026-06-16  
**Status:** S1 bot running with bugs fixed · data reset to $500 · dashboard pointing at S1 tab

---

## Current State

### What is running on VPS
- **`bybit-s1.service`** → `/opt/trd/bybit_s1_runner/main.py` — **ACTIVE** (S1 Liq Sweep, 6 symbols)
- **`bybit-combined.service`** → STOPPED (ER+VW+S1 combined) — archived 2026-06-16
- **`solana-meme-bot.service`** → still running (separate, unrelated)

### Why we reset
Full audit (2026-06-16) found two bugs in the live S1 bot that caused it to underperform vs backtest:

#### Bug 1 — CRITICAL FIXED: 7 NameErrors in `_check_pending()`
**File:** `bybit_s1_runner/systems/s1_liq_sweep.py`

Bare identifiers used as variable names instead of string literals. Every 15m tick in PENDING state raised NameError → caught silently → symbol permanently stuck in PENDING until bot restart. Only `__init__` recovery on restart could transition PENDING→OPEN. Caused ~5 missed signals in the first 2 days (especially the profitable June 15 long entries that the backtest captured). Evidence: all trades with `atr_at_fill=0.0` in the pre-reset trades.csv were restart-recovered.

**Fixed:** All 7 string literals corrected in `systems/s1_liq_sweep.py`.

#### Bug 2 — FIXED: ATR formula mismatch
**File:** `bybit_s1_runner/lib/indicators.py`

Live used Wilder's ATR (alpha=1/14≈0.071). Backtest uses EWM(span=14, alpha=2/15≈0.133). Live ATR was ~6–7% larger → `body_min_atr=0.3×ATR` filter was stricter → some valid sweep signals rejected.

**Fixed:** Changed to EWM(span=14). New formula matches backtest to 6 decimal places on all 6 symbols.

#### Non-bug: losses ranging -0.97R to -1.46R
Live `pnl_r` = NET (Bybit `closedPnl` includes fees). Backtest `pnl_r` = GROSS. Compare live to backtest `pnl_r_net`, not `pnl_r`. All correct. Fees run 0.1–0.5R per trade depending on risk% and leverage.

### Corrected S1 results (pre-reset, excl. known-bad first ETH trade)
24 trades from June 14–16 with bugs present:
- Win rate: 33.3% (8/24)
- EV/trade: -0.167R
- Total R: -4.01R
- Final equity (from $500): $479.21 (-4.2%)
- Max DD: 7.3%

The system underperformed because of the PENDING stuck bug causing missed trades. Backtest showed +0.06R EV for the same period (vs -0.167R live). After fixes, live should converge toward backtest long-run +0.196R EV.

### Data archive
Old ER+VW+S1 history archived on VPS at:
`/opt/trd/bybit_trading_bot/results/live_investment/archive/`
Also in git history: commit `fabd418d` on `investment_demo_bot` branch.

---

## Current data files (as of reset 2026-06-16 08:33 UTC)

| File | Contents |
|------|----------|
| `trades.csv` | Header only — fresh start |
| `equity.csv` | Header only (ER+VW stopped) |
| `equity_s1.csv` | $500 starting row |
| `events.jsonl` | Empty |
| `portfolio.json` | `{"equity":500.0,"peak":500.0,"dd_tier":"FULL"}` |
| `active_state.json` / `active_state_s1.json` | All null |

**Note:** User will manually adjust Bybit demo account balance to $500. Bot read $500.75 on first tick (close enough — the equity_s1.csv starting row is $500 so the dashboard will show $500 as the anchor).

---

## Dashboard changes made

- `app/page.tsx` — `/` now redirects to `/s1` (S1 is the landing page)
- `components/TabNav.tsx` — S1 tab is first; other tabs labeled "(archive)"

Dashboard reads equity_s1.csv row 0 as `startingEquity` dynamically, so the $500 start is automatic.

---

## VPS bot management

**ALWAYS use:**
```bash
systemctl restart bybit-s1
systemctl status bybit-s1
journalctl -u bybit-s1 -n 50
```

**NEVER:** `kill -9` + `nohup` (caused dual-instance bug previously)

### Bot parameters (s1_a — unchanged)
- swing_n=10, body_min_atr=0.3, sl_atr_mult=1.0, TP_R=2.0, MAX_FILL_BARS=4
- RISK_PCT=1%, LEVERAGE=10×, CANDLE_LIMIT=100, ATR_PERIOD=14
- Symbols: BTC, ETH, SOL, ADA, XRP, DOGE (all USDT linear perps)
- Demo account: `api-demo.bybit.com`

### If the bot crashes
```bash
journalctl -u bybit-s1 -n 100
systemctl restart bybit-s1
```

---

## Next tasks (for future sessions)

1. **Monitor first 50+ trades** with fixed bot — compare EV to backtest +0.196R target
2. **Twitter content:** Post the audit findings as a transparency thread:
   - "We found 2 bugs that were hurting our results — here's what happened"
   - Show live -0.167R vs backtest +0.196R gap
   - Explain the NameError bug in plain language
   - Explain the clean reset to $500
   - Link to dashboard (S1 tab)
3. **After ~100 live trades:** Formal live vs backtest EV comparison
4. **Consider:** Add `atr_at_fill` logging to the restart-recovery path in `__init__` so we don't lose ATR info on restarts

---

## Files changed this session

### VPS deployed
- `/opt/trd/bybit_s1_runner/systems/s1_liq_sweep.py` — 7 NameErrors fixed in `_check_pending()`
- `/opt/trd/bybit_s1_runner/lib/indicators.py` — ATR changed from Wilder's to EWM(span=14)

### Dashboard (push to main → Vercel auto-deploy)
- `app/page.tsx` — redirect to `/s1`
- `components/TabNav.tsx` — S1 tab first, others labeled "(archive)"

### GitHub bot repo (`investment_demo_bot` branch)
- `results/live_investment/` — all data files reset
- `results/live_investment/archive/` — historical data preserved
