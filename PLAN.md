# Bybit Bot Dashboard — Implementation Plan

## Project Overview

Public-facing trading dashboard for **solanasniperclub.com** showing live performance of an
automated Bybit futures trading bot. Goal: build audience transparency → affiliate revenue
(via tradefeecalc.com) → future bot monetization (copy-trade, subscriptions).

The bot is live on a **demo account** and will eventually move to live funds. Dashboard is
honest about this — demo badge is always visible.

---

## Business Context

- **Domain:** solanasniperclub.com
- **Brand:** Solana Sniper Club (umbrella for Bybit bot + Solana meme bot)
- **Traffic funnel:** Dashboard → tradefeecalc.com → exchange affiliate signups
- **Monetization path (Year 1):** affiliate commissions + ad revenue
- **Monetization path (Year 2+):** Bybit copy-trade followers, premium Discord, bot subscriptions
- **Content strategy:** YouTube/social media showing bot trades transparently (no "guaranteed
  profits" claims — show real drawdowns and losses)

---

## Bot Architecture (read-only context)

**Bot repo:** `git@github.com:TiagoLuz9292/bybit_trading_bot.git`
**Branch with live data:** `investment_demo_bot`
**Bot running on:** VPS at `167.233.21.208` (root user, `~/.ssh/id_rsa`)
**Bot directory on VPS:** `/opt/trd/bybit_trading_bot`

### Two trading systems running simultaneously:
- **System ER (EMA Ribbon):** trades ETHUSDT, SOLUSDT, ADAUSDT, DOGEUSDT — 3-4R TP
- **System VW (VWAP Touch):** trades BTCUSDT, ETHUSDT, SOLUSDT, ADAUSDT, XRPUSDT, DOGEUSDT — 1.5-2.5R TP
- Both: bidirectional (long/short), hedge mode, 15-minute candles, 10× leverage
- Risk per trade: ~1-2% of equity, with drawdown tiers that reduce sizing

### Data files (updated automatically on each trade close via git push):
| File | Contents |
|------|----------|
| `results/live_investment/trades.csv` | All closed trades (27 rows as of 2026-06-04) |
| `results/live_investment/equity.csv` | Equity curve — one row per trade close |
| `results/live_investment/active_state.json` | Current open trades |
| `results/live_investment/portfolio.json` | `{equity, peak, dd_tier}` |

### trades.csv columns:
`close_ts, system, symbol, direction, entry_type, fill_price, stop_loss, take_profit,
tp_r, atr_at_fill, r_pct, dollar_risk, htf_multi_aligned, outcome, exit_price,
candles_held, pnl_r, pnl_usd, equity_after, dd_pct`

### equity.csv columns:
`ts, equity, peak, dd_pct, dd_tier, system, symbol, direction, pnl_r, pnl_usd`

**Bot git-push pipeline:** `logger.py:log_trade_close()` → `_git_push_results()` (background
thread) → `git commit + push origin investment_demo_bot`. Added 2026-06-04.

---

## Data Architecture

### Sources
| Data | Source | Refresh |
|------|--------|---------|
| Trade history, equity curve | GitHub API (private repo, PAT) | On page load + every 15 min (ISR) |
| Active open trades | GitHub `active_state.json` (PAT) | On page load + every 60s (client poll) |
| Portfolio equity/peak/DD | GitHub `portfolio.json` (PAT) | Same as above |
| Live unrealized PnL | Bybit API v5 (read-only key) | Client poll every 30s |
| Live account balance | Bybit API v5 (read-only key) | Client poll every 30s |

### Why GitHub API (not Bybit API) for history:
The trades.csv was manually corrected during bot development. Bybit's own trade history
has gaps/errors from early bot bugs. The CSV is the source of truth.

### Why not SSH/git fetch on Vercel:
Vercel serverless functions can't run git with custom SSH keys. GitHub API with a PAT
is the clean solution for private repos.

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 14 (App Router) | SSR + API routes + ISR in one |
| Styling | TailwindCSS | Fast dark theme, utility-first |
| Charts | TradingView Lightweight Charts | Professional trading chart look, free |
| Secondary charts | Recharts | Monthly returns, win/loss distribution |
| CSV parsing | papaparse | Robust CSV handling |
| Deployment | Vercel | Auto-deploy from GitHub, free tier |
| Language | TypeScript | Type safety for API responses |

---

## Environment Variables (Vercel)

```
GITHUB_PAT=<fine-grained PAT, read-only access to TiagoLuz9292/bybit_trading_bot>
GITHUB_REPO=TiagoLuz9292/bybit_trading_bot
GITHUB_BRANCH=investment_demo_bot
BYBIT_API_KEY=<read-only key>
BYBIT_API_SECRET=<read-only secret>
BYBIT_BASE_URL=https://api-demo.bybit.com
```

**Never commit these to git.** Add to `.env.local` for local dev (gitignored).
Add to Vercel dashboard for production.

---

## File Structure

```
bybit_bot_dashboard_ui/
├── app/
│   ├── layout.tsx              # Root layout, dark theme, fonts
│   ├── page.tsx                # Main dashboard page
│   ├── globals.css
│   └── api/
│       ├── trades/route.ts     # Fetch + parse trades.csv from GitHub
│       ├── equity/route.ts     # Fetch + parse equity.csv from GitHub
│       ├── active/route.ts     # Fetch active_state.json from GitHub
│       ├── portfolio/route.ts  # Fetch portfolio.json from GitHub
│       └── positions/route.ts  # Fetch live positions from Bybit API
├── components/
│   ├── StatsHeader.tsx         # Top bar: equity %, win rate, PF, max DD
│   ├── DemoBadge.tsx           # Always-visible "DEMO ACCOUNT" indicator
│   ├── LiveStatus.tsx          # Current open trades card
│   ├── EquityChart.tsx         # TradingView Lightweight Charts equity curve
│   ├── MonthlyReturns.tsx      # Monthly PnL table
│   ├── TradeHistory.tsx        # Filterable trade history table
│   └── PerformanceBreakdown.tsx # Win rate by symbol/system
├── lib/
│   ├── github.ts               # GitHub API file fetcher
│   ├── bybit.ts                # Bybit v5 API client (HMAC-SHA256 signing)
│   └── calculations.ts         # Win rate, profit factor, drawdown calcs
├── types/
│   └── index.ts                # Trade, EquityPoint, ActiveTrade, Portfolio types
├── PLAN.md                     # This file
├── .env.local.example
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Pages / Sections (V1)

### 1. Stats Header (always visible)
- Starting equity: $300 (hardcoded — first row of trades.csv)
- Current equity: from `portfolio.json`
- **Total return %:** `(current - 300) / 300 * 100`
- Win rate: wins / total closed trades
- Profit factor: gross wins / gross losses (in USD)
- Max drawdown: max `dd_pct` across all equity.csv rows
- Total trades: count of trades.csv rows
- "DEMO ACCOUNT" badge — always visible, no hiding it

### 2. Live Status Card
- Pulls from `active_state.json` + Bybit positions API
- Shows each open trade: symbol, system, direction, entry, SL, TP, unrealized PnL
- "No active positions — scanning market..." when empty
- Refreshes every 30 seconds via client-side polling

### 3. Equity Curve (TradingView Lightweight Charts)
- Line chart of equity over time from `equity.csv`
- X-axis: timestamp, Y-axis: USD equity
- Tooltip shows: date, equity, trade that caused the change, PnL

### 4. Monthly Returns Table
- Computed from `equity.csv` grouped by month
- Columns: Month | Return % | Trades | Win Rate
- Color-coded: green positive, red negative

### 5. Trade History Table
- All rows from `trades.csv`, newest first
- Columns: Date | System | Symbol | Direction | Entry | Exit | PnL (R) | PnL ($) | Outcome
- Filters: System (ER/VW/All), Symbol, Direction (Long/Short/All), Outcome (Win/Loss/All)
- Expandable rows: show SL, TP, candles held, HTF aligned, ATR

### 6. Performance Breakdown
- Win rate + avg R by symbol
- Win rate + avg R by system (ER vs VW)
- Long vs short breakdown

---

## V2 Features (future sessions)

- Market scanner showing bot's internal score per symbol (requires bot API endpoint)
- Live activity feed (trade opens, closes in real time)
- Email signup (Mailchimp/ConvertKit integration)
- Soft CTA linking to tradefeecalc.com
- SEO: meta tags, Open Graph for social sharing
- Performance: stale-while-revalidate caching

---

## Deployment Steps (when ready)

1. Push dashboard repo to GitHub (new repo: `TiagoLuz9292/bybit-bot-dashboard-ui` or similar)
2. Connect Vercel to that GitHub repo
3. Add all env vars in Vercel dashboard
4. Set custom domain: solanasniperclub.com
5. Vercel auto-deploys on every push to main

---

## Current Status (2026-06-04)

- [x] Bot auto-pushes trades.csv/equity.csv to GitHub on trade close (logger.py patched)
- [x] Data verified: 27 trades, 18 equity points, equity $426 (+42% from $300 start)
- [x] PLAN.md written
- [x] Next.js project scaffolded
- [x] GitHub API client (`lib/github.ts`)
- [x] Bybit API client (`lib/bybit.ts`)
- [x] API routes (trades, equity, active, portfolio, positions)
- [x] StatsHeader component
- [x] LiveStatus component
- [x] EquityChart component
- [x] MonthlyReturns component
- [x] TradeHistory component
- [x] PerformanceBreakdown component
- [x] .env.local.example
- [x] Build passes (TypeScript clean, `npm run build` success)
- [ ] Vercel deployment (needs GitHub repo + env vars in Vercel dashboard)

---

## Key Decisions Made

1. **Demo account shown openly** — "DEMO ACCOUNT" badge always visible. Transparency builds trust.
2. **trades.csv is source of truth** — not Bybit API history (CSV was manually corrected).
3. **GitHub API for historical data** — not SSH/git (Vercel incompatible with SSH key auth).
4. **Bybit API for live data only** — positions and unrealized PnL.
5. **No affiliate blocks on dashboard** — soft funnel only ("calculate fees" button → tradefeecalc.com).
6. **Starting equity $300** — hardcoded as the bot's initial demo balance.
