## Context

The signal detail route `/signal/[slug]` parses a two-leg pair such as `SOL:20-ETH:80` (token A long with 20% notional split, token B short with 80%). The UI already loads **Pacifica market metadata** (cached ~24h) for both symbols, shows account summary via `/api/pacifica/account` when a wallet is connected, and exposes **position size** and **leverage** controls. `handleOpenPosition` in `signal-detail-card.svelte` is still a **placeholder**.

Pacifica exposes **update leverage** (per symbol), **batch order**, and **create market order** semantics per their REST docs. Market info supplies **max leverage**, **min lot**, **min tick**, and **min order size** for valid quantity and price rounding.

## Goals / Non-Goals

**Goals:**

- Compute **total notional** as **position size (USD collateral intent) × selected leverage**, then allocate **long** notional to slug token A and **short** notional to token B using the slug percentages (e.g. $10 × 10 = **$100** → **$20** long SOL, **$80** short ETH for `SOL:20-ETH:80`).
- Before opening, call **update leverage** for **both** symbols to the **same** user-selected leverage (capped by existing **effective max** from market metadata).
- Build **two market orders** (long A, short B) and submit via **batch order**, with sizes derived from current marks and **rounded/clamped** using each symbol’s **lot**, **tick**, and **min order size** from cached market info (see Pacifica tick/lot documentation).
- On **full success** of the sequence (both leverage updates and batch submission accepted as defined by API responses), persist the **route slug** (or a defined **canonical pair key** equal to it) in **browser storage** as an **active position** for that pair.
- **Disable** the Open position CTA when storage already contains an active entry for the **same** pair key as the current page.

**Non-Goals:**

- Closing positions, PnL tracking, or syncing active list with Pacifica open positions (reconciliation).
- Server-side persistence of active positions or multi-device sync.
- Changing the weighted-candle chart or signals API enrichment behavior.
- Supporting allocation percentages that do not sum to 100 (slug format already enforces valid pairs; if sum ≠ 100, treat as out of scope unless product fixes slug rules).

## Decisions

1. **Where trading API calls run**  
   Prefer **SvelteKit API routes** (similar to `/api/pacifica/account`) so `PACIFICA` base URL and any **server-held authorization** stay out of the client. If Pacifica requires **per-user signed** payloads (e.g. wallet signature), the design SHALL follow the same pattern as any existing signing flow in the repo; if none exists, add a minimal endpoint that accepts **signed body** from the client and forwards to Pacifica without logging secrets. *Rationale:* consistency with account proxy and reduced secret exposure.

2. **Order sizing pipeline**  
   - Inputs: `sizeUsd` (user collateral), `leverage` (integer), `allocA`, `allocB` (integers from slug), mid or last prices for A and B from existing price/mark sources used by the UI or a dedicated quote read.  
   - `notionalTotal = sizeUsd * leverage`.  
   - `notionalLong = notionalTotal * (allocA / 100)`, `notionalShort = notionalTotal * (allocB / 100)`.  
   - Convert each **USD notional** to **base asset quantity** using current price, then **quantize** using that symbol’s **lot size**, **tick/min tick** as applicable to the order fields Pacifica expects, and enforce **≥ min order size** (document exact field mapping during implementation against [Create market order](https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/orders/create-market-order)).  
   - *Alternatives considered:* sending USD “size” directly—rejected if API is contract-size based only.

3. **Sequence: leverage then batch**  
   **Update leverage** for symbol A, then B (or parallel if API allows and idempotent), then **one batch** with long market + short market. On partial failure after leverage changed, surface error and avoid writing active position; optional follow-up could revert leverage—**out of scope** unless API mandates.

4. **Active position identity**  
   Store the **exact route `slug` string** (e.g. `SOL:20-ETH:80`) as the pair key so it matches user mental model and URL. Normalization: **as parsed for the page** (same casing as canonical display tokens if the app normalizes symbols). *Alternative:* sort tokens lexicographically—rejected unless duplicate `A:B-C:D` vs `C:D-A:B` must be treated as one; product chose “same pair as this page.”

5. **Storage mechanism**  
   **`localStorage`** JSON array (or map) of `{ slug, openedAt }` under a single app key (e.g. `castor:activePairPositions`). Read on mount; write after successful flow. *Alternative:* `sessionStorage`—rejected because user expectation is “cannot open again” across reloads.

6. **UX states**  
   Loading state on CTA during leverage + batch; inline or toast **error** with non-technical fallback; success message optional; CTA **disabled** with short explanation when duplicate active pair.

## Risks / Trade-offs

- **Leverage changed without filled orders** → User leverage on symbols may differ until they manually adjust; mitigation: clear error copy and no active-position write on failure.  
- **Stale cache vs exchange constraints** → Rare rejections if market info TTL drifts; mitigation: surface API error and optional single refresh retry.  
- **localStorage** can be cleared by user or another tab; mitigation: documented behavior; future sync with real positions.  
- **Rounding** may make legs slightly off exact dollar split; mitigation: document that notionals are **targets** subject to lot/tick minima.

## Migration Plan

- Ship behind no feature flag unless required: new endpoints and UI wiring deploy together.  
- **Rollback:** remove CTA handler binding and API routes; active storage key can remain harmless.  
- No database migrations.

## Open Questions

- Exact Pacifica request bodies and **authentication** (header vs signed JSON) for **update leverage** and **batch order**—confirm against live docs and existing `locals.pacificaApiAuthorization` usage.  
- Whether **batch** API accepts two **market** orders in one call with the project’s current API version; if not, fall back to sequential **create market order** with same user-visible behavior.
