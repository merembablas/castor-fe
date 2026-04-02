## Why

The Positions page still shows three fixed dummy rows, so users cannot see real open pair trades, live unrealized P&L, or a list that matches what they actually hold on Pacifica. Replacing this with live REST positions plus mark-price updates makes the page trustworthy and actionable.

## What Changes

- **Source of rows**: Drive `/positions` from **active pair slugs** in browser storage (`castor:activePairPositions`), cross-checked against **Pacifica REST [Get positions](https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/account/get-positions)** so each displayed row has real **entry price** and **position size** per underlying symbol.
- **Unrealized P&L**: Subscribe to Pacifica WebSocket **mark price candle** for each symbol that backs an active row; recompute unrealized P&L on each candle update using entry, size, and side (long vs short per leg).
- **Cache reconciliation**: If the API shows **no** open position for symbols tied to a cached pair slug, **remove** that slug from active-pair storage. If the API has an open position for a symbol **not** tied to any cached pair slug, **do not** show it on this page (positions list is pair-centric, not a raw account dump).
- **Remove** reliance on static dummy data for the main list (dummy module may remain only if still useful for tests or Storybook).

## Capabilities

### New Capabilities

- _(none — behavior stays under the existing Positions product surface)_

### Modified Capabilities

- `positions`: Replace dummy-only list with cache + Pacifica-backed rows, live P&L from mark-price candles, reconciliation rules above, and updated empty/loading/error scenarios. Preserve existing UX requirements where they still apply (navigation, row fields where data exists, P&L coloring, long/short distinction, Close control, design-system conformance).

## Impact

- **Routes / UI**: `src/routes/positions/+page.svelte`, `src/lib/components/position-list-item.svelte`, position types currently tied to `dummy-positions`.
- **Client state**: `src/lib/signal/active-pair-positions.ts` (extend with prune/remove helpers or equivalent).
- **Pacifica integration**: New or extended client modules for REST positions and WebSocket mark-price subscription (reuse existing auth / base URL patterns from trade execution and weighted candles).
- **Specs**: Delta under `openspec/specs/positions/spec.md`.
