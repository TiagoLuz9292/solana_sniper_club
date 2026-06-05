# Bybit Bot Dashboard — Claude Context

Read this at the start of every session. It documents the full architecture, data flow, decisions, and wiring so you can continue work without re-deriving context.

---

## What This Project Is

Public trading dashboard at **solanasniperclub.com** showing live performance of an automated Bybit futures bot. The goal is transparent audience-building → affiliate revenue (tradefeecalc.com) → eventual copy-trade/subscription monetization. The bot runs on a **demo account** — a "DEMO ACCOUNT" badge is always visible on the dashboard.

---

## Related Bot Repository

**Repo:** `git@github.com:TiagoLuz9292/bybit_trading_bot.git`  
**Branch:** `investment_demo_bot`  
**VPS:** `167.233.21.208`, root user  
**Bot dir on VPS:** `/opt/trd/bybit_trading_bot`  
**SSH git key on VPS:** `/root/.ssh/git_key` (not `id_rsa`)

### Two trading systems running simultaneously:
- **ER (EMA Ribbon):** ETHUSDT, SOLUSDT, ADAUSDT, DOGEUSDT — 3-4R take-profit
- **VW (VWAP Touch):** BTCUSDT, ETHUSDT, SOLUSDT, ADAUSDT, XRPUSDT, DOGEUSDT — 1.5-2.5R TP
- Both: bidirectional, hedge mode, 15-minute candles, 10× leverage, ~1-2% risk per trade

### Bot auto-push pipeline:
`logger.py:log_trade_close()` → `_git_push_results()` (background thread) → `git commit && git push origin investment_demo_bot`  
Patched 2026-06-04. Bot pushes after every trade close.

### Bot-written data files (`results/live_investment/`):

| File | Written by bot | Contents |
|------|---------------|----------|
| `trades.csv` | On trade close | All closed trades — source of truth |
| `equity.csv` | On trade close | Equity curve, one row per close |
| `active_state.json` | On open/close | `{SYMBOL: {active_trade: {...} or null}}` |
| `portfolio.json` | On trade close | `{equity, peak, dd_tier}` — simulated, no fees |
| `market_state.json` | Every 15m tick | Real Bybit balance + per-symbol ER/VW/HTF state |
| `events.jsonl` | Every event | Chronological log: setup, trade_open, trade_close, setup_cancelled |
| `setups.csv` | On setup | Setup candidates (used for backfill, not displayed) |

**Important:** `portfolio.json` equity drifts from real Bybit balance because it ignores fees. `market_state.json` has the real `real_balance` from Bybit. Always prefer `market_state.json` for displaying current equity.

---

## Dashboard Architecture

**Framework:** Next.js 14 (App Router), TypeScript, TailwindCSS  
**Charts:** TradingView Lightweight Charts (equity curve), Recharts (monthly returns)  
**Deployment:** Vercel, auto-deploys from **main** branch of `TiagoLuz9292/solana_sniper_club`

**CRITICAL:** Vercel watches `main`, not `master`. Always push with `git push origin master:main`.

---

## Environment Variables

Add to `.env.local` for dev, and to Vercel dashboard for production. Never commit.

```
GITHUB_PAT=<fine-grained PAT, read-only on TiagoLuz9292/bybit_trading_bot>
GITHUB_REPO=TiagoLuz9292/bybit_trading_bot
GITHUB_BRANCH=investment_demo_bot
BYBIT_API_KEY=<read-only key>
BYBIT_API_SECRET=<read-only secret>
BYBIT_BASE_URL=https://api-demo.bybit.com
```

---

## Data Flow

### Server-side (page.tsx, `force-dynamic`)
`getData()` fetches 5 files in parallel from GitHub on every page load:
1. `trades.csv` → parsed with PapaParse, sorted newest-first → `Trade[]`
2. `equity.csv` → parsed, sorted oldest-first → `EquityPoint[]`
3. `portfolio.json` → fallback equity source
4. `active_state.json` → open trade count for `StatsHeader`
5. `market_state.json` → real Bybit balance; `currentEquity = marketState.equity ?? portfolio.equity`

`currentEquity` (real) is passed to `computeStats()`, `StatsHeader`, and `EquityChart`.

### Client-side polling
- `StatsHeader` — polls `/api/active` + `/api/market-state` every 30s; updates open trade count and live equity/total return
- `LiveStatus` — polls `/api/active` every 30s; fetches unrealized PnL per symbol from Bybit API via `/api/positions`
- `EventsFeed` — polls `/api/events` every 30s
- `MarketState` — polls `/api/market-state` every 60s

---

## API Routes (`app/api/`)

| Route | Source | Notes |
|-------|--------|-------|
| `/api/trades` | GitHub → `trades.csv` | Not currently used from page.tsx (server-side direct) |
| `/api/equity` | GitHub → `equity.csv` | Not currently used from page.tsx |
| `/api/active` | GitHub → `active_state.json` | Polled by LiveStatus + StatsHeader |
| `/api/portfolio` | GitHub → `portfolio.json` | Fallback only |
| `/api/market-state` | GitHub → `market_state.json` | Real equity + per-symbol state |
| `/api/events` | GitHub → `events.jsonl` | `force-dynamic`; returns array newest-first |
| `/api/positions` | Bybit v5 API | Live unrealized PnL; HMAC-signed in `lib/bybit.ts` |

### `lib/github.ts`
Single function `fetchFileFromGitHub(path)` — uses GitHub Contents API with PAT, `Accept: application/vnd.github.raw+json`. Returns raw text. `cache: "no-store"`.

### `lib/bybit.ts`
Bybit v5 API client with HMAC-SHA256 signing. Demo endpoint: `https://api-demo.bybit.com`.

### `lib/calculations.ts`
- `computeStats(trades, equity, currentEquity)` — win rate, profit factor, max DD, total return
- `computeMonthlyReturns(equity)` — groups equity.csv by month

---

## Components

| Component | Type | What it does |
|-----------|------|-------------|
| `StatsHeader` | Client | Top bar: Total Return, Equity, Win Rate, Profit Factor, Max DD, Open Trades. Polls every 30s for live updates. |
| `LiveStatus` | Client | Full-width open trades strip. When trades exist: horizontal scrollable cards (w-52 each) showing system/symbol/direction/entry/SL/TP/risk/live PnL. When empty: one line of text. |
| `EquityChart` | Client | TradingView Lightweight Charts. Line from $300 starting equity. Trade markers on close dates. Last point is overwritten with `currentEquity` (real Bybit balance) to absorb fee drift silently. |
| `EventsFeed` | Client | Polls `/api/events`. Shows last 30 events newest-first: setup, trade_open, trade_close, setup_cancelled. Scrollable, max 24rem height. |
| `MarketState` | Client | 3-column card: ER ribbon state, VW vs VWAP, HTF alignment (1h/2h/4h short+long). Polls every 60s. Shows placeholder when `market_state.json` not yet written. |
| `PerformanceBreakdown` | Server | 3-column table: win rate + avg R by Symbol / System / Direction. Computed from trades prop. |
| `MonthlyReturns` | Server | Monthly return table from equity.csv. Color-coded green/red. |
| `TradeHistory` | Client | Filterable table (System/Symbol/Direction/Outcome filters with labels). Expandable rows show SL/TP/risk/bars/HTF details. |

---

## Page Layout Order (`app/page.tsx`)

```
Header (title + DEMO badge + LIVE badge)
StatsHeader
LiveStatus                              ← full-width, thin
[2-col] EquityChart | EventsFeed
MarketState                             ← full-width, 3-col on xl
[3-col] PerformanceBreakdown(2/3) | MonthlyReturns(1/3)
TradeHistory
Footer (disclaimer + tradefeecalc.com link)
```

---

## Key Decisions Made

1. **`trades.csv` is source of truth, not Bybit API** — Bybit's own history had gaps from early bot bugs. The CSV was manually corrected.

2. **GitHub API for historical data, not SSH/git** — Vercel serverless functions cannot run git with custom SSH keys. GitHub Contents API with a PAT is the clean solution.

3. **Real equity from `market_state.json`, not `portfolio.json`** — `portfolio.json` calculates equity as `+= pnl_r * dollar_risk` with no fee deduction. After 28 trades this drifts ~$2.71 from the real Bybit balance. `market_state.json` uses `real_balance` from `bybit_account.get_balance()`.

4. **Equity chart last point = real balance** — Instead of appending a new point (which would show a fake drop due to fee drift), we overwrite the last existing data point with `currentEquity`. This absorbs the gap silently into the last trade's candle.

5. **`events.jsonl` backfilled from history** — The file was created by running a backfill script on the VPS that converted trades.csv + setups.csv into 80 chronological events. The bot now appends to this file going forward.

6. **DEMO badge always visible** — Transparency builds trust. Never hide it.

7. **Vercel watches `main` branch** — The working branch is `master`. Always push with `git push origin master:main` so Vercel picks up changes.

8. **Starting equity $300** — Hardcoded in `lib/calculations.ts` and `components/StatsHeader.tsx`. This was the initial demo balance.

---

## `market_state.json` Schema

Written by the bot every 15-minute candle tick:

```json
{
  "ts": "2026-06-05T08:30:00Z",
  "bar": 0,
  "equity": 438.33,
  "dd_pct": 0.0,
  "dd_tier": "FULL",
  "er": {
    "DOGEUSDT": { "ribbon": "short_stacked", "status": "idle", "ema21": ..., "ema55": ..., "atr": ... }
  },
  "vw": {
    "DOGEUSDT": { "vwap": ..., "pct_vs_vwap": ..., "status": "idle" }
  },
  "htf": {
    "DOGEUSDT": {
      "60":  { "short_aligned": true, "long_aligned": false, "ema_trend": "...", "macd_dir": "..." },
      "120": { ... },
      "240": { ... }
    }
  }
}
```

## `events.jsonl` Schema

One JSON object per line, newest lines appended at bottom:

```json
{"ts": "...", "type": "setup|setup_cancelled|trade_open|trade_close", "system": "ER|VW", "symbol": "DOGEUSDT", "direction": "short", ...}
```

Event types:
- `setup` — limit order placed, waiting for fill
- `setup_cancelled` — limit order cancelled (reason field)
- `trade_open` — fill confirmed, trade live
- `trade_close` — trade exited (outcome: win|loss, pnl_r, pnl_usd, equity_after)
