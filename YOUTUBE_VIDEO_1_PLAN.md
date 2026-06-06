# YouTube Video 1 — Full Production Plan

**Title:** I built an algo trading bot and made everything public — here's the full breakdown  
**Target length:** 12–15 minutes  
**Format:** Screen recording + voiceover, no face required  
**Record by:** Saturday–Sunday 7–8 June 2026  
**Publish by:** Monday–Tuesday 9–10 June 2026

---

## The Core Narrative Arc

This is not a tutorial. This is not a "look how much I made" flex.  
The hook is **radical transparency** — every trade, every loss, every fee, on a public dashboard, live, right now.

The enemy in the story is the culture of crypto Twitter: backtest screenshots, highlight-reel traders, "signals" accounts that never show a losing trade. You are the counter-argument. You built a system, ran it on a real account, published every result from day one, and you're walking people through the actual numbers.

The secondary hook is the **fee blindspot** — most traders never calculate what fees actually cost them over time. The bot does it automatically, and you built a tool (tradefeecalc.com) that lets anyone do the same.

---

## Target Viewer

- Trader (beginner to intermediate) curious about algorithmic trading
- Skeptic of "algo bots" who has been burned by black-box signals
- Fee-conscious futures trader who is on Bybit or considering it
- Anyone searching: "algo trading bot results", "bybit trading bot", "automated crypto trading"

---

## Video Structure

### Segment 0: Hook (0:00–0:45)

**Screen:** Open the browser directly to solanasniperclub.com. Let the dashboard load live — no pre-recorded static screenshot.

**Script:**
> "This is a live trading dashboard. The bot running behind it has been trading for the last few weeks — 24 hours a day, 7 days a week. Every trade it makes gets logged automatically: entry price, exit, fees paid, equity after. No cherry-picking. No hiding the losses. Everything is on this page, public, right now."

> "In this video I'm going to walk you through exactly what it is, how it works, what the real numbers look like — including the bad stretches — and why I think tracking fees is the thing most traders completely ignore."

**Why this works:** You open on the product, not on a talking head or a title card. The viewer immediately sees something real. The mention of "bad stretches" is a trust signal — you're not pretending it's a win machine.

---

### Segment 1: What This Actually Is (0:45–2:30)

**Screen:** Keep the dashboard visible. Scroll slowly from top to bottom so the viewer sees the full page layout before you go deep.

**Script:**
> "Let me give you the full picture before we go into detail."

> "This is a Bybit futures trading bot — it runs on a demo account. I want to be upfront about that. The demo account is real-time market data and real order execution logic, but there's no real money behind it. The reason I'm starting on demo is simple: I want a verifiable track record before I put real capital in. Anyone can show you a backtest. A live track record from day one is a different thing."

> "The bot runs two independent systems simultaneously. The first is the EMA Ribbon system — it trades ETH, SOL, ADA, and DOGE on the 15-minute chart, looking for stacked EMAs with higher-timeframe alignment. Take profit is 3–4R. The second is the VWAP Touch system — it trades 6 pairs including BTC, and it fades overextended moves from the VWAP anchor. Take profit is 1.5–2.5R."

> "Both systems are fully automated. I do not manually enter or exit any trade. The bot opens the position, sets the SL and TP, and closes it. Every single close gets logged to a CSV file and pushed to GitHub, and the dashboard reads that file. That's the whole pipeline."

**Key numbers to mention naturally:**
- $300 starting equity (hardcoded starting point)
- 32 closed trades so far
- Running since approximately mid-April 2026

---

### Segment 2: Live Dashboard Walkthrough (2:30–6:00)

This is the core of the video. Take your time. Be specific.

#### 2a — Stats Header (2:30–3:30)

**Screen:** Zoom into the StatsHeader row at the top.

**Script:**
> "At the top of the dashboard you have the key stats, calculated live from the trade history."

Walk through each one:
- **Total Return: +64.1%** — "Starting from $300, the account is now at $492. That's from real closed trades, not a backtest."
- **Win Rate: 65.6%** — "21 wins, 11 losses out of 32 closed trades. I want to be honest that this is a small sample. 32 trades is not statistically significant. But the structure of the systems — high R multiples, tight stops — is designed to produce an edge over time, and so far we're tracking positive."
- **Profit Factor: 5.84** — "This means for every dollar lost, the system has made nearly six dollars. That's high — unusually high — and again, small sample. But the structure of 3–4R take profits with tight stops makes this possible in theory."
- **Max Drawdown: -5.9%** — "The worst stretch from a peak. That was real, it's on the equity curve, you can see it."
- **Open Trades:** whatever it shows live

> "These numbers update automatically every 30 seconds from the Bybit API and from the bot's files on GitHub."

#### 2b — Equity Curve (3:30–4:30)

**Screen:** Click into the equity chart, hover over the chart at key points.

**Script:**
> "Here's the equity curve. Every dot on this line is a closed trade. You can see it's not a straight line up — there were runs of losses, there were flat periods. The chart starts at $300 and ends at the current real balance from Bybit."

> "One thing I want to highlight: this is the actual Bybit balance, not a simulated number. There's a distinction — the bot internally tracks a simulated equity by adding R multiples, but that calculation doesn't account for fees. The dashboard always shows the real account balance. I'll come back to the fee point in a minute."

Hover over the drawdown section:
> "This section here — this is where the account had four or five losses in a row. It dropped about 6% from the peak. That's the system working as designed — losses are capped to roughly 1–2% of equity per trade, so even a losing streak doesn't blow the account."

#### 2c — Live Status Strip (4:30–5:00)

**Screen:** Scroll to the LiveStatus cards if any trades are open.

**Script (if open trades exist):**
> "Right now the bot has [N] open positions. Each card shows the system, symbol, direction, entry price, SL and TP, and the live unrealized PnL pulling directly from Bybit's API. This updates in real time."

**Script (if no open trades):**
> "Right now there are no open positions — the bot is waiting for the next setup to trigger. This is normal. The systems only trade when conditions are exactly right."

#### 2d — Trade History (5:00–6:00)

**Screen:** Scroll to the TradeHistory table. Expand 1–2 rows.

**Script:**
> "The full trade history is at the bottom. You can filter by system, symbol, direction, or outcome. Let me expand a trade."

Expand a winning trade:
> "This one — DOGE short on the ER system. Entry, stop, take profit. Risk $5.29. Exit R: 4.0. That means the bot risked $5.29 and made 4 times that — $21.16 gross. Fees on entry and exit came out of that. Net PnL and equity after are logged."

Expand a losing trade:
> "Here's a loss — [symbol], [system]. Risk $X, stopped out for minus $X. That's a clean 1R loss. The system hit the stop, the trade closed, the bot moved on."

> "Every trade is here. Nothing is hidden."

---

### Segment 3: The Fee Problem (6:00–9:30)

This is the natural bridge to tradefeecalc.com.

**Screen:** Switch to tradefeecalc.com. Start on the homepage.

**Script:**
> "I want to talk about fees for a minute because this is something almost no retail trader thinks about seriously."

> "The bot is running at 20x leverage with 1–2% risk per trade. Each trade has an entry fee and an exit fee — on Bybit futures those are typically 0.055% for a taker fill. On a $500 position that's about $0.27 per fill, $0.55 round trip."

> "That doesn't sound like much. But across 32 trades, the bot has paid [X] in fees. On a $300 starting account, that's [X]% of starting capital — gone before we even talk about PnL."

> "Now imagine you're trading manually — larger size, more frequency. The fee drag compounds fast."

**Screen:** Navigate to the Bybit trading fee calculator on tradefeecalc.com.

> "I built this calculator for exactly this. You put in your trade size, your entry and exit price, the leverage, and it splits out your entry fee, your exit fee, and the total round-trip cost. That's it — no signup, no fluff."

Do a live calculation using one of the bot's actual trade parameters. Good example: the XRP VW trade from June 5th.
- Trade size: e.g. $500 (margin)
- Maker fee: 0.02% (Bybit futures maker)
- Taker fee: 0.055% (Bybit futures taker — what the bot uses on fills)
- Leverage: 20x
- Entry: 1.1364, Exit: 1.1201
- Show the result — entry fee + exit fee + round-trip total

> "So on that one trade — roughly [X] in entry fees, [X] in exit fees, [X] total. Every trade has a different fee because the position size changes with each setup — smaller risk, smaller position, smaller fee. But it adds up. Expand any row in the trade history and you can see exactly what each trade cost. Across 32 trades that's real money quietly leaving the account."

**Screen:** Navigate to a comparison page, e.g. Bybit vs MEXC.

> "If you're shopping exchanges, this comparison page shows you the exact fee difference in dollar terms for your position size. MEXC charges 0% maker on futures — Bybit charges 0.02%. On large size over many trades, that gap is real money."

---

### Segment 4: How the Bot Actually Works (9:30–12:00)

**Screen:** Back to solanasniperclub.com. Go to the MarketState component or the EventsFeed.

**Script:**
> "I want to show you the EventsFeed — this is a live log of everything the bot does."

Scroll through the events:
> "Every 15 minutes the bot evaluates conditions across all its pairs. When it sees a setup, it logs a 'setup' event and places a limit order. If the order fills, it logs 'trade_open'. If conditions cancel before fill, 'setup_cancelled'. When the trade closes, 'trade_close' with outcome, R multiple, and equity after."

> "The bot is running on a VPS — it never sleeps, it never misses a candle, it doesn't make emotional decisions. It either sees a setup or it doesn't."

**Screen:** Show the MarketState panel.

> "This panel shows the current market state the bot is reading right now. For each pair it shows the EMA ribbon alignment, how the price sits relative to VWAP, and whether the higher timeframes — 1h, 2h, 4h — are aligned. A trade only opens if all conditions line up. That's why it doesn't trade every candle."

> "June 5th was a busy day — the bot closed 4 trades: DOGE short +4R, XRP short +1.5R, ETH short +3R, SOL short +3R. Four wins in one session. Then on June 6th another DOGE short hit +4R. But I've also had days with 3 or 4 straight losses — May 27th saw four consecutive losses. Both are part of the system."

---

### Segment 5: What's Next (12:00–13:30)

**Screen:** Back to dashboard overview.

**Script:**
> "Here's where this is going."

> "Right now the bot is on a demo account because I want a real, auditable track record before I put real money in. The dashboard has been public from trade one. When the sample size is large enough — I'm thinking 100+ trades — and the metrics hold, the next step is moving to a live Bybit account."

> "After that, the goal is copy trading. If you follow this channel, you'll be able to see exactly what the system's track record looks like when that decision gets made. No surprise launches, no selling a signal with a 30-trade backtest. The record is public."

> "I'll be posting trade updates on Twitter at @sol_sniper_club every time the bot opens or closes a position. If you want the live feed without checking YouTube, that's the place."

> "And if you trade and you want to understand your own fee costs, tradefeecalc.com has calculators for Bybit, Binance, MEXC, and every major exchange — free, no signup."

---

### Outro (13:30–14:00)

**Script:**
> "That's the full picture. Dashboard is live at solanasniperclub.com — everything updates automatically. Subscribe if you want to follow the track record. I'll be back when there's something real to report."

No sponsor read. No dramatic music build. Just end the video.

---

## Screen Recording Plan

### Before you hit record — setup checklist

- [ ] Browser tabs open in order: solanasniperclub.com, tradefeecalc.com homepage, Bybit fee calculator on tradefeecalc.com, Bybit vs MEXC comparison
- [ ] Dashboard is showing current live data (do a hard refresh before starting)
- [ ] At least 1 trade open on the LiveStatus strip, OR be ready to say "no positions right now"
- [ ] Zoom browser to 125% — looks better on screen recording than 100%
- [ ] Use 1920x1080. If you have a 4K monitor, record at 1080p scale
- [ ] Close all notifications on the OS before starting
- [ ] Record audio and video separately if possible (OBS: separate tracks) — easier to re-record a section

### Segment-by-segment screen notes

| Segment | Screen action |
|---------|---------------|
| 0:00 Hook | Slow scroll top to bottom on solanasniperclub.com |
| Stats Header | Zoom browser to 150% temporarily to make numbers readable |
| Equity Chart | Hover over the drawdown section, hover over a big win candle |
| Trade History | Expand 1 winning trade + 1 losing trade, scroll slowly |
| tradefeecalc | Homepage → Bybit calculator → enter real values → show result → comparison page |
| MarketState | Show the 3 columns, point at specific conditions |
| EventsFeed | Scroll slowly, pause on a trade_close event |

---

## Title Options

**Primary (recommended):**
> I built an algo trading bot and made everything public — here's the full breakdown

**Alternatives to A/B test later:**
> My trading bot ran for 32 trades. Here are the real numbers.
> I automated my crypto trading and published every result from day one
> Algo trading bot — $300 → $492 in 32 trades (everything public)

---

## Thumbnail

**What works for this video:**

- Split layout: left side = screenshot of the equity curve going up; right side = bold stat
- Stat to feature: **+49.2%** or **30 trades, 0 hidden**
- Text: large, high contrast, max 5 words
- No face required, but if you want to add one, expression = calm/confident (not hype)

**Suggested text overlay:**
```
$300 → $492
Every trade public
```

Background: dark, dashboard screenshot faded slightly.

---

## Video Description (paste into YouTube)

```
I built an automated trading bot on Bybit and published every trade from day one — wins, losses, fees, equity curve. Nothing hidden.

In this video I walk through:
- What the bot actually is (two systems: EMA Ribbon + VWAP Touch)
- Live dashboard walkthrough — all stats, equity curve, trade history
- The fee drag that most traders never calculate
- What the plan is once the track record is long enough

Live dashboard: https://solanasniperclub.com
Fee calculator: https://tradefeecalc.com
Twitter (trade updates): https://twitter.com/sol_sniper_club

---

Stats at time of recording:
- Starting equity: $300
- Current equity: ~$492
- Closed trades: 32
- Win rate: 65.6%
- Profit factor: 5.84
- Max drawdown: -5.9%

---

This is a demo account. No real capital at risk during the track record period. I'll be transparent when/if that changes.

#algotrading #cryptotrading #bybit #tradingbot #automatedtrading
```

---

## After Publishing — Immediate Actions

1. Post on Twitter (@sol_sniper_club):
   > First video is live — full breakdown of the bot, the dashboard, and 32 trades of real results.
   > [YouTube link]
   > Nothing scripted, no highlight reel. Just the numbers.

2. Pin the video link on your Twitter profile temporarily.

3. Add the YouTube link to the bio on solanasniperclub.com footer (if not already there).

4. Clip 3 sections for TikTok:
   - The equity curve walkthrough with the drawdown explanation (30–45 sec)
   - The live trade card expansion showing a winning + losing trade (30 sec)
   - The fee calculator live demo on tradefeecalc.com (45 sec)

---

## What NOT to Do

- Do not re-record sections until the whole video is done once. Get the full rough take first.
- Do not add background music under voiceover — it's distracting and makes the serious tone feel like hype.
- Do not use a script word for word. Use these as talking points and speak naturally. Re-records of over-rehearsed content sound worse than natural hesitations.
- Do not open with "Hey guys welcome back to my channel." Open on the dashboard with no intro.
- Do not edit out pauses longer than 0.5s — some silence is fine for a technical video. Over-editing makes it feel like a promo.
