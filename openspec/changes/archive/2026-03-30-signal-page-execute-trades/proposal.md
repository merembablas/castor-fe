## Why

Users can connect a Solana wallet and see Pacifica account context on `/signal/[slug]`, but **Open position** does not yet execute real trades. Pair signals encode a long/short split (e.g. `SOL:20-ETH:80`); we need to turn **position size**, **leverage**, and that split into **Pacifica market orders** safely, then **remember active pair positions** in the browser so the same pair cannot be opened twice by mistake.

## What Changes

- Use existing **cached market info** (max leverage, min lot, min tick, min order size) when building order sizes so submissions respect Pacifica constraints ([Get Market Info](https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/markets/get-market-info), [tick and lot size](https://pacifica.gitbook.io/docs/api-documentation/api/tick-and-lot-size)).
- **Update leverage** on Pacifica for **both** symbols via [Update leverage](https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/account/update-leverage) to the user-selected value before opening.
- Submit a **batch** of **two market orders** ([Batch order](https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/orders/batch-order)) aligned with [Create market order](https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/orders/create-market-order): **long** on slug token A with **A%** of **total notional** (size × leverage), **short** on token B with **B%** of that notional (e.g. size **$10**, leverage **10x** → **$100** notional → **$20** long SOL, **$80** short ETH for `SOL:20-ETH:80`).
- After **all** steps succeed (leverage updates + batch), persist the **signal pair identity** (normalized slug / pair key) in **browser storage** as an **active position** entry.
- **Disable** the open-position action when the current route’s pair already has an **active** stored entry (same pair cannot be opened again until cleared or position management exists).

## Capabilities

### New Capabilities

- `pacifica-trade-execution`: Pacifica-authenticated flow to set per-symbol leverage, compute per-leg notional from slug ratios and user size/leverage, round or clamp using market metadata (min lot, tick, min order size), submit batch market orders, and surface success/failure to the UI.

### Modified Capabilities

- `signal-detail`: **Open position** SHALL trigger the trade-execution flow when a wallet is connected; SHALL disable or block the CTA when an active stored position exists for the same pair key as the current slug; SHALL show explicit in-progress and error states for the multi-step API sequence.

## Impact

- **Code**: `src/routes/signal/[slug]`, `signal-detail-card` (or related components), new Pacifica client helpers (leverage, batch orders), sizing utilities; possible Worker/proxy routes if signing or CORS require it (follow existing Pacifica patterns in the repo).
- **APIs**: Pacifica REST **update leverage**, **batch order**, **market order** payloads; reuse existing **market info** cache.
- **Storage**: `localStorage` or equivalent keyed list of active pair positions (structure TBD in design); no server persistence in this change unless already present.
- **Security**: Wallet signing and secrets must not be exposed in client bundles beyond existing wallet/Pacifica integration patterns.
