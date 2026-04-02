## Why

Traders can open a position from a signal and later see the same signal again on the home list without a clear cue that they already have an open pair for it. Surfacing that state on each live signal card reduces confusion and duplicate opens, using data the app already keeps in client storage (`castor:activePairPositions`).

## What Changes

- On `/`, when a live signal row’s navigable **slug** matches an entry in **active pair positions** cache (same slug key the positions flow uses), the card SHALL show a **visible label** (pill/badge) that the user **already has an open position** for this signal.
- The label SHALL be **design-system aligned**: oceanic palette, pill radius, optional **icon** plus short text—not plain body copy alone; soft accent consistent with long/short badges.
- Matching SHALL use the **same slug identity** as signal detail navigation (long/short tokens and rounded allocations), so false positives/negatives align with how the app keys stored pairs.
- No change to how positions are opened or closed; **read-only** use of existing cache on the home list.

## Capabilities

### New Capabilities

- _(none — behavior extends existing live signals list UI only)_

### Modified Capabilities

- `live-signals`: Add a requirement that live signal cards indicate when the corresponding pair slug exists in active pair position cache, with design-system-compliant pill/badge treatment (icon + text).

## Impact

- **Affected**: Home route signal list components and any shared helper that resolves “slug in `castor:activePairPositions`” (may reuse patterns from `/positions` or signal detail).
- **Storage**: Read `castor:activePairPositions` (or the project’s single abstraction over it) on the client; keep subscriptions/reactivity so the label appears or clears when storage changes without requiring a full page reload where the app already supports it.
- **Dependencies**: None new; aligns with existing **positions** capability’s storage contract.
