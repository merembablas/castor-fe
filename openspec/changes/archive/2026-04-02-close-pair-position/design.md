## Context

`/positions` renders rows from `castor:activePairPositions` cross-checked with Pacifica **Get positions**. Each row includes a **Close position** button (`position-list-item.svelte`) with no `onclick` today. Opening a pair uses `executePairTradeClient`: agent-signed `create_market_order` via `/api/pacifica/orders/create-market`, long = `bid` on symbol A, short = `ask` on symbol B, `reduce_only: false`.

## Goals / Non-Goals

**Goals:**

- On **Close position**, submit Pacifica orders that **fully flatten** the long (A) and short (B) legs using sizes taken from the **current** open positions returned by Get positions (no user-entered partial size).
- Treat success like the open flow: **both** closing orders must succeed before mutating client state.
- On success, **remove** the row’s **slug** from `castor:activePairPositions` and drop any **slug-scoped** client caches introduced for pair trading UX (audit at implementation time; today the primary slug-keyed store is active-pair list).
- Expose **busy** and **error** states on the control; refresh the list after success (existing reconciliation logic can rely on storage + refetch).

**Non-Goals:**

- Partial closes, limit/stop exit orders, or closing a single leg while leaving the other open.
- Forcing invalidation of the **server** in-memory `/pairs` payload cache (not keyed by slug).

## Decisions

1. **Closing mechanism** — Use **two** `create_market_order` calls (same proxy path as open), with **`reduce_only: true`**, **opposite sides** to the open position (close long → sell/`ask` on A; close short → buy/`bid` on B), and **amount** derived from Pacifica position size fields for each symbol, normalized with the same lot/tick helpers as open where applicable. **Rationale**: Mirrors the open path, minimizes new API surface. **Alternative**: Dedicated “close position” REST endpoint if Pacifica adds one—defer unless docs require it.

2. **No leverage step on close** — Skip `update_leverage` for close; only submit reduce-only market orders. **Rationale**: Closing does not need to change max leverage. **Alternative**: Update leverage before close if exchange errors without it—handle if observed in QA.

3. **State cleanup** — Implement `removeActivePairPosition(slug)` (or equivalent) in `active-pair-positions.ts` and call it only after both closes succeed. **Rationale**: Single source of truth for “tracked pair” across positions and signal detail.

4. **Component boundaries** — Pass a callback from `+page.svelte` into `PositionListItem` with `slug`, `symA`, `symB`, and merged position sizes (or raw merged row) so the list item stays presentational where possible; async close + agent key access stays in the page or a small `close-pair-position-client.ts` module. **Rationale**: Matches how open flow centralizes `executePairTradeClient`.

5. **Concurrency** — Disable **all** close buttons (or only the row in flight—product choice) while a close is in progress to avoid double submission. **Rationale**: Safer default is per-row disabled + optional global guard if needed.

## Risks / Trade-offs

- **[Risk]** First leg closes, second fails → user has one-sided exposure. → **Mitigation**: Surface error clearly; user may need manual intervention; consider ordering (e.g. short first) only if product prefers—document in code comments.
- **[Risk]** Amount rounding differs from exchange position size. → **Mitigation**: Use exact position size strings from API where possible; align with `trade-sizing` / market metadata.
- **[Risk]** Agent key not ready. → **Mitigation**: Same guards as open (disable + message).

## Migration Plan

No server migration. Deploy as a normal frontend release. Rollback: revert client changes; users keep using exchange UI if close is broken.

## Open Questions

- Confirm Pacifica **create_market_order** with `reduce_only: true` accepts the same `amount` encoding as open orders for both legs (verify against live or docs during implementation).
