# Active Task — Combined ER+VW+S1 System

**Last updated:** 2026-06-15  
**Status:** Dashboard combined tab built — bot switch pending

---

## What was done this session

### VPS data corrections (double-stack bug)
Three S1 trades were opened at 2× intended position size due to a bot bug.
Corrections applied to `trades.csv`, `equity_s1.csv`, `events.jsonl`, and `market_state_s1.json`
on the VPS and pushed to `investment_demo_bot` branch:

| Trade | Was | Corrected |
|-------|-----|-----------|
| XRPUSDT short (Jun 14 23:45) | pnl_usd=−10.20, eq=435.46 | pnl_usd=−5.10, eq=440.92 |
| BTCUSDT short (Jun 15 11:00) | pnl_usd=−8.25, eq=421.99 | pnl_usd=−4.12, eq=436.79 |
| ETHUSDT short (Jun 15 11:00) | pnl_usd=−10.58, eq=421.99 | pnl_usd=−5.29, eq=431.50 |

market_state_s1.json equity manually set to 430.0 (Bybit balance after manual correction).

### Dashboard: max drawdown fix
`lib/calculations.ts` now computes max DD from the running equity series as a fallback
when the bot writes dd_pct=0 (which S1 currently does).

### Dashboard: Combined tab added (`/combined`)
- Route: `/combined` — "All Systems" tab in TabNav
- Loads ALL trades (ER + VW + S1) from trades.csv
- Merges equity.csv (ER+VW, starts ~$300) + equity_s1.csv (S1) chronologically
- ER+VW ended at ~$440.62, S1 started at ~$440.75 — same account, seamless stitch
- Starting equity = $300
- New API routes: `/api/combined/active` (merges both active states), `/api/combined/market-state` (uses S1 file)
- Events feed uses existing `/api/events` (already all systems, no filter)

---

## Next step: Switch bot to combined ER+VW+S1 mode

### What needs to happen on the VPS

1. **Stop current S1-only bot:**
   ```bash
   systemctl stop bybit-s1
   ```

2. **Check if a combined bot service exists or needs to be created:**
   - Current service: `bybit-s1.service`
   - The combined bot needs to run ER + VW + S1 with max 1 trade per symbol
   - Confirm the bot code supports combined mode (check `/opt/trd/bybit_trading_bot/`)

3. **If combined bot code exists:**
   - Create/update a systemd service for it (e.g. `bybit-combined.service`)
   - Start it: `systemctl start bybit-combined`
   - Verify it writes to the existing files (trades.csv, equity_s1.csv, market_state_s1.json etc.)
   - OR: if it writes to new files, update `/api/combined/active` and `/api/combined/market-state` routes to point to new file paths

4. **File path changes** (if combined bot uses different files):
   - Update `app/combined/page.tsx` `getData()` to fetch correct file paths
   - Update `app/api/combined/active/route.ts` and `market-state/route.ts`

### Dashboard update once combined bot is confirmed
- Update the "All Systems" tab description from "ER + VW + S1 Combined" to match actual running config
- Confirm equity curve shows correct continuous curve from $300 → current

---

## Architecture notes

### Same Bybit demo account for all systems
ER+VW and S1 run on the same account. equity.csv and equity_s1.csv are sequential,
not parallel — no offsetting needed to stitch them.

### Max 1 trade per symbol constraint
The combined bot must enforce this. S1 previously had a double-stack bug where two
positions opened on the same symbol simultaneously. Ensure the combined bot checks
for open positions before entering.

### Bot VPS details
- VPS: `167.233.21.208`, root user
- Bot dir: `/opt/trd/bybit_trading_bot`
- Branch: `investment_demo_bot`
- SSH git key: `/root/.ssh/git_key`
- Current running service: `bybit-s1.service`
