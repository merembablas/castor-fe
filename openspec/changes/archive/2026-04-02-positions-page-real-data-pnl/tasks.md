## 1. Types and Pacifica REST positions

- [x] 1.1 Add or extend Pacifica REST types and a typed client helper for [Get positions](https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/account/get-positions) consistent with existing auth/base URL patterns.
- [x] 1.2 Implement a pure function to map API position rows to per-symbol entry, size, and side fields used by P&L (document field mapping in code).

## 2. Slug resolution and merge logic

- [x] 2.1 Resolve each `ActivePairPosition.slug` to token A/B symbols and allocations (reuse existing pairs/signal slug resolution utilities or load functions used on signal detail).
- [x] 2.2 Implement merge: eligible rows = slugs in storage where **both** symbols have matching open positions in the REST response; expose loading/error/empty states.
- [x] 2.3 Implement reconciliation: remove slug from storage when REST shows no open position for **either** leg (use `localStorage` write helpers in `active-pair-positions.ts` or adjacent module).

## 3. Mark price WebSocket and P&L

- [x] 3.1 Subscribe to Pacifica WebSocket [mark price candle](https://pacifica.gitbook.io/docs/api-documentation/api/websocket/subscriptions/mark-price-candle) for the union of symbols across eligible rows; handle connect/disconnect and resubscribe when the symbol set changes.
- [x] 3.2 Implement pure P&L helpers: per-leg unrealized from entry, size, side, and mark; aggregate to row USD and percent consistent with `OpenPosition` / UI fields.
- [x] 3.3 Wire updates so P&L recomputes on each candle message for any subscribed symbol; show pending state until first mark per symbol.

## 4. UI and route integration

- [x] 4.1 Replace `DUMMY_POSITIONS` on `src/routes/positions/+page.svelte` with the new data layer (store/class + `$effect` cleanup for WS).
- [x] 4.2 Refactor `OpenPosition` (rename/move from `dummy-positions` if needed) so fields reflect real data; update `position-list-item.svelte` props and any optional/missing **generated** time display.
- [x] 4.3 Add empty, loading, error, and unauthenticated states per spec; keep existing design-system styling and long/short visuals.

## 5. Verification

- [x] 5.1 Manual test: storage + API aligned → rows and live P&L; close legs → prune after REST refresh; orphan API-only → no row.
- [x] 5.2 Run `pnpm check` (or project equivalent) and fix any new type or lint issues.
