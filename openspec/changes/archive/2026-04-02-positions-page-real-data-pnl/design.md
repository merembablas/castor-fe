## Context

Today `/positions` renders `DUMMY_POSITIONS` from `src/lib/positions/dummy-positions.ts`. Real pair intent is tracked in `localStorage` under `castor:activePairPositions` (`ActivePairPosition`: `slug`, `openedAt`), written when a user successfully opens a trade from signal detail. Pacifica already exposes [Get positions](https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/account/get-positions) (REST) and [mark price candle](https://pacifica.gitbook.io/docs/api-documentation/api/websocket/subscriptions/mark-price-candle) (WebSocket). The app already integrates Pacifica REST and WebSockets elsewhere (e.g. weighted candles, trade execution).

## Goals / Non-Goals

**Goals:**

- Show **only** pair positions that exist in **active pair storage** and are **confirmed** by Pacifica REST positions for the two underlying symbols of that pair (slug → symbols via existing pairs/signal resolution paths).
- Display **entry** and **size** from API position objects; compute **unrealized P&L** from mark prices and update on **each mark-price candle** message for the subscribed symbols.
- **Prune** storage when the API indicates no open position for the legs of a cached slug; **ignore** API-only positions that do not correspond to a cached pair slug (no orphan rows).

**Non-Goals:**

- Implementing **Close position** execution in this change (can remain a stub or existing behavior unless already specified elsewhere).
- Server-side persistence of active pairs (remains client `localStorage`).
- Showing a full **account-wide** position list independent of Castor’s pair tracking.

## Decisions

1. **Row source of truth (display)**  
   **Intersection** of (A) slugs in `readActivePairPositions()` and (B) Pacifica REST positions for both legs of that slug.  
   **Rationale**: Product requirement explicitly excludes orphan API positions and requires stale cache cleanup.

2. **Fetch model**  
   After resolving active slugs to symbol pair + metadata (allocations, labels), call **Get positions** with the same **authenticated** Pacifica client pattern as other account endpoints (agent key / wallet). Parse per-symbol **entry price** and **size** (exact field names per Pacifica response types in code).  
   **Alternative considered**: Infer from orders only — rejected; positions API is the stated source.

3. **PnL and mark price**  
   Open **one** WebSocket connection (or reuse an existing app-wide Pacifica WS if present) and subscribe to **mark price candle** for the **set union** of symbols across all **display-eligible** rows. On each candle update for symbol `S`, update mark for `S` and recompute **per-leg** unrealized P&L using side (long token A / short token B), entry, size, and latest mark; **aggregate** to row-level USD and percent (percent denominator aligned with existing UI: e.g. vs opening notional or margin — document chosen formula in code comments to match `OpenPosition` fields).  
   **Alternative considered**: REST poll for mark — rejected; user asked for candle-driven realtime updates.

4. **Reconciliation timing**  
   Run REST fetch on **page load** and on a **bounded** refresh (e.g. focus, interval, or manual refresh) to detect closed legs; apply **prune** when API missing positions for either leg of a slug. WebSocket alone is insufficient to detect full close.  
   **Rationale**: Avoid stale rows; WebSocket may not signal “position gone.”

5. **Svelte 5 module boundaries**  
   Prefer a small **store or class** in `$lib` (e.g. under `signal/pacifica/`) that: merges cache + REST + WS, exposes readonly state for the page, and handles subscribe/cleanup in `$effect` from `+page.svelte`.  
   **Rationale**: Keeps the route thin and testable.

6. **Empty and error states**  
   If storage is empty → empty list message. If wallet / auth missing → explain that positions need connection. If REST fails → error state, no fabricated rows.

## Risks / Trade-offs

- **[Risk] Wrong P&L formula vs exchange** → **Mitigation**: Map Pacifica position fields (side, size, entry) explicitly; unit-test pure P&L helpers with documented examples; align sign with long/short legs from slug allocations.
- **[Risk] WebSocket churn when symbol set changes** → **Mitigation**: Diff symbol set on merged rows; unsubscribe unused; debounce rapid storage changes.
- **[Risk] Pruning removes slug while user still has a partial fill** → **Mitigation**: Only prune when API says **both** legs required for the pair are absent (or per product rule: if either leg missing, drop pair — confirm with Pacifica semantics; default **either leg missing** removes row and slug to avoid ghost pairs).

## Migration Plan

1. Ship behind no feature flag (replace dummy list entirely once verified).
2. Manual QA: open pair → appears on `/positions`; close on exchange → row disappears and slug pruned after refresh rule fires.
3. Rollback: revert to dummy data module if critical (keep git revert path).

## Open Questions

- Exact Pacifica position JSON fields for entry, size, and side — **resolve during implementation** from official docs and live responses (typed in `rest-types` or adjacent).
- Whether **generated** time should remain signal time from backend slug metadata or hidden when unavailable.
