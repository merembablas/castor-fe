## Why

The Positions page already shows a **Close position** control on each row, but it does nothing. Users who want to exit a tracked pair trade need a single action that closes **both** legs at full size on Pacifica and keeps local state (active pair tracking and any slug-scoped client data) consistent with the exchange.

## What Changes

- **Wire Close position**: On `/positions`, activating **Close position** for a row SHALL submit exchange actions to **fully close** the **long** leg (token A) and **short** leg (token B) for that pair—**no** partial close; sizes SHALL match current open positions from Pacifica for those symbols.
- **Success path**: After **both** legs are successfully closed (per the same “all steps succeed” spirit as open position), the system SHALL **remove** that pair’s **slug** from **`castor:activePairPositions`** and SHALL clear or invalidate **client-side pair/slug-scoped caches** associated with that slug (so signal detail and other views do not assume the pair is still open). **Server** `/pairs` in-memory TTL cache is global, not per slug—no requirement to flush that unless product later defines slug-level invalidation.
- **UX**: Loading/disabled state on the button during submission, visible errors on failure, design-system **secondary** Close styling preserved.
- **Auth**: Close SHALL use the same **API agent** signing model as the existing open-pair flow where applicable.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `positions`: Specify that **Close position** closes both legs at full size, handles busy/error states, and on success removes the slug from active pair storage and slug-scoped client caches.
- `pacifica-trade-execution`: Add requirements for **pair close** (two closing orders or equivalent Pacifica semantics, **reduce-only** or documented close path, full leg sizes, failure handling consistent with open flow).

## Impact

- **UI**: `src/lib/components/position-list-item.svelte` (handler, disabled/busy), `src/routes/positions/+page.svelte` (refresh storage/list after close).
- **Pacifica client**: New or extended module alongside `execute-pair-trade-client.ts` for close (market reduce-only or documented close API).
- **Storage**: `src/lib/signal/active-pair-positions.ts`—add **remove slug** helper if missing; call after successful close.
- **Specs**: Deltas under `openspec/changes/close-pair-position/specs/positions/spec.md` and `.../pacifica-trade-execution/spec.md`.
