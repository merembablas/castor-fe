# Castor FE

Front end for a **pair-trading** workflow: browse signals and candidate pairs, open and track two-leg positions (long one asset, short another), and wire that to Pacifica.

This repo is the **UI layer**—charts, lists, and actions—not the strategy engine that generates signals.

---

## Why pair trading?

Instead of betting “this coin goes up,” you’re usually betting that **two related assets drift apart and then snap back**—long one, short the other at the same time.

- **Less “which way is the whole market going?”** You care more about the *gap* between the two than about one ticker mooning or dumping.
- **Often smoother ride** than a naked long or short, because the legs can offset part of the noise (not risk-free—things can still go wrong).
- **Easier story in your head** than “is BTC fair value?”—you’re asking “is A cheap *versus* B right now?”
- **Mean reversion in one sentence:** when a pair stretches like a rubber band, some traders trade the idea it tends to relax again.
- **Capital and macro:** shorts can help fund longs in many setups, and shared industry or macro shocks sometimes partially wash out because you’re in both names.

Castor is built around that idea: see signals, inspect a pair, size a trade, then monitor and close from **Positions**.

---

## Pages (what they are & how to use them)

Open the menu (top left) to move between sections. You’ll need a **connected Solana wallet** for anything that talks to the exchange (opening/closing, live account data on detail/positions).

| Route | Name | What it is | How to use it |
|--------|------|------------|----------------|
| `/` | **Live signals** | Current pair signals from the live feed—long/short legs, allocations, optional news teasers. | Scan what’s active. Tap a row to open the **signal detail** page for that pair. If the signals feed isn’t configured in the environment, you’ll see a setup message instead of a list. |
| `/pairs` | **Pairs** | **Cointegration-style candidates** from the pairs feed: which symbols are paired, stats, funding context, and suggested split from the model. | Use this to **research relationships** between assets before or alongside signals—not every row is a live “trade me now” button; it’s the broader universe the system considers. |
| `/signal/[slug]` | **Signal detail** | Deep view for **one** signal: charting, sizing inputs, leverage/account context, and actions to **open** a pair position (via Pacifica) when your wallet is connected. | Pick a total size, review legs and limits, then open if you’re happy with the risk. This is where execution for a chosen signal happens. |
| `/positions` | **Positions** | **Active** pair positions merged with what’s on the account, plus **historical** closed pairs stored in the browser. Live marks and **close** actions where supported. | Connect your wallet, refresh to pull exchange positions, switch **Active / Historical**, and close from here when you want out. |
| `/archives` | **Archives** | **Past** signals that left the live list—still readable, still link to the same detail URL shape. | Browse old ideas or compare what fired before; open any card to see the full **signal detail** page for that slug. |

**Note:** Routes under `/api/...` are for the app itself (server endpoints), not pages you bookmark for daily browsing.

---

## Development

Use [Bun](https://bun.sh/) as the package manager.

```sh
bun install
bun dev
```

Other common scripts: `bun run build`, `bun run check`, `bun run lint`.
