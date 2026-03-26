## Why

Traders viewing a signal detail route (e.g. `/signal/ETH:20-SOL:80`) can connect a Solana wallet, but the page does not yet surface Pacifica account or market constraints needed to size positions safely or choose leverage. Pacifica documents REST endpoints for **market info** (per-symbol max leverage, min lot, ticks, min order size) and **account info** (equity, margin used, spendable balance). Adding this data and controls makes the detail page actionable when a wallet is connected without hammering APIs on every navigation.

## What Changes

- Fetch and use **Pacifica Get Market Info** for the signal’s two symbols to drive max leverage (combined rule: use the **minimum** of the two symbols’ max leverage values), min lot, min ticks, and min order size as reference for opening orders.
- **Cache market metadata** on a **daily** cadence (or equivalent TTL ~24h) so routine page opens do not refetch full market info every time.
- Add a **leverage selector** (combobox or similar) beside **position size**, with options at **5x steps** from 5x up to the effective max leverage (e.g. 5, 10, 15, 20 when max is 20). If the effective max is below 5x (e.g. 3x), expose **only** that maximum as the sole option (or highest allowed step ≤ max).
- When the wallet is connected and a wallet address is available, call **Pacifica Get Account Info** and show **available balance to spend** and an indicator of **margin usage vs. liquidation risk** (ratio of `total_margin_used` to `account_equity`; at 100% margin used relative to equity, position is at liquidation pressure—present as a clear percent or progress affordance).
- Place the balance / margin block **below the description** and **above position size**, only when account data is applicable (wallet connected + successful fetch or explicit empty/error state per product choice).

## Capabilities

### New Capabilities

- `pacifica-market-metadata`: Pacifica REST **get market info** integration for symbols on the signal detail page; **daily (or ~24h) cache** of responses; exposure of per-symbol **max leverage**, **min lot**, **min ticks**, and **min order size** for UI and order reference.

### Modified Capabilities

- `signal-detail`: When a Solana wallet is connected with an address, the detail view **SHALL** show **leverage selection** (5x steps capped by min of both symbols’ max leverage, with sub-5x max handled as specified), **account balance available to spend**, and **margin used vs. equity** for liquidation context; layout **SHALL** place this block between **description** and **position size**; market metadata **SHALL** inform leverage bounds and order constraints.

## Impact

- **Routes / UI**: Signal detail page (`/signal/[slug]`) and any shared components for size, CTA, and wallet-gated panels.
- **Data**: New or extended client/server helpers for Pacifica REST (market info, account info), cache storage (e.g. KV, memory + persistence strategy per deployment—see design), environment or config for Pacifica base URL if not already centralized.
- **Dependencies**: Existing Solana wallet connection flow; no breaking change to URL slug format.
- **External APIs**: [Pacifica Get Market Info](https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/markets/get-market-info), [Pacifica Get Account Info](https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/account/get-account-info).
