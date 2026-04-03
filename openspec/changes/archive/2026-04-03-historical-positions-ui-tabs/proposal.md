## Why

Closed pair positions are already persisted to browser web cache (`castor:historicalPairPositions` per the historical-positions capability), but the app offers no way to review that history. Users need the same entry point as open positions—without a new route—so they can compare active and past pairs in one place.

## What Changes

- Add **tabs** on the existing `/positions` page: **Active** (current behavior) and **Historical** (read-only list from the historical web-cache store).
- **Historical** rows reuse the same card vocabulary as active rows (long/short legs, allocations, opened time, size-style presentation where applicable) but show **realized P&L** at close (from stored data), a **closed** datetime, and **no Close position** control.
- Reuse the **right-hand column** that currently holds **Close position** on active cards to show **funding paid** and **closed** datetime on historical cards. Style **funding paid** with **green** for positive amounts and **red** for negative, with non-color-only cues (e.g. signed values) consistent with existing P&L accessibility rules.
- Active tab keeps live mark-price behavior, close flow, and reconciliation; historical tab does not subscribe to marks or offer close.

## Capabilities

### New Capabilities

- (none — behavior extends the existing positions surface and consumes the existing historical storage contract)

### Modified Capabilities

- `positions`: Extend `/positions` with Active/Historical tabs; define historical list sourcing and card layout (closed time, funding in the action column, no close); scope “close control” and live P&L requirements to **active** rows where they would conflict with historical read-only rows.

## Impact

- **Routes / UI**: `src/routes/positions/+page.svelte` (and possibly layout copy), `src/lib/components/position-list-item.svelte` or a dedicated historical variant, shared formatters/styles per design system.
- **Data**: `readHistoricalClosedPairPositions` and types in `src/lib/positions/historical-pair-positions.ts` (read path only unless mapping helpers are needed).
- **Specs**: Delta under `openspec/changes/historical-positions-ui-tabs/specs/positions/spec.md` only; `historical-positions` storage spec remains the source of truth for persisted fields.
