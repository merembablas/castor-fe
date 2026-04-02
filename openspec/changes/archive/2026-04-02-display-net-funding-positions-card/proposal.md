## Why

Traders care about cumulative funding on perpetual positions alongside unrealized P&L. Pacifica already exposes per-position `funding` on **Get positions**, but the Positions UI does not surface it, so users cannot see net funding paid across the long and short legs of a pair row without leaving the app.

## What Changes

- **Net funding on each pair row**: For every displayed position row, show **net funding paid** derived from the **`funding`** field on each leg’s Pacifica position (long and short symbols), using the same **Get positions** response already used for entry, size, and reconciliation ([Pacifica Get positions](https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/account/get-positions)).
- **Placement and hierarchy**: Render net funding **directly below** unrealized P&L on the row/card, with **smaller** typography than the P&L line so P&L stays visually primary.
- **Formatting**: Present the combined value in a user-scannable way (e.g. signed USD or consistent with existing currency formatting on the row), including non-color-only cues where sign matters (aligned with existing P&L accessibility patterns).

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `positions`: Extend row content to include **net funding paid** from Pacifica per-leg `funding`, placed under unrealized P&L with reduced font size; specify loading/empty behavior if a leg’s funding is missing when the row is otherwise shown.

## Impact

- **UI**: `src/lib/components/position-list-item.svelte` (or equivalent row component) and any parent that passes position leg data.
- **Types / data mapping**: Pacifica position types and mapping from **Get positions** to include `funding` per symbol; aggregate both legs for the pair row.
- **Specs**: Delta under `openspec/changes/display-net-funding-positions-card/specs/positions/spec.md` for the `positions` capability.
