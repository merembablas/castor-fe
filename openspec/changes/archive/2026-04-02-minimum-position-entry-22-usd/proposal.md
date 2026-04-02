## Why

Traders see raw **lot size** and **min order (base units)** on the signal detail card, which is hard to interpret and pushes cognitive load onto users who only think in USD. The product wants a single, clear rule: **minimum entry is $22** in USD, aligned with how users size positions.

## What Changes

- Set the **product minimum total position size** (total amount in USD on signal detail) to **$22** for opening a position.
- **Remove** the card copy that lists per-symbol **lot size** and **min order** (base units).
- Replace exchange-centric helper text with **simple USD copy** stating that **minimum entry is $22** (total amount), while keeping sizing logic that still respects the **higher of $22 and exchange-derived minimums** so orders remain valid when the exchange requires more notional than $22.
- Adjust default/sync behavior for the total amount field so the effective floor is **at least $22** and **at least** the computed exchange minimum when applicable.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `signal-detail`: Open-position sizing UX and requirements on signal detail—minimum entry messaging, removal of lot/min order display, and minimum total notional rules—change to reflect the $22 product floor and simplified copy.

## Impact

- **Primary UI:** `src/lib/components/signal-detail-card.svelte` (constraints hint block, total amount sync, any derived minimums used for hints or apply-min actions).
- **Shared sizing (if needed):** `src/lib/signal/pacifica/trade-sizing.ts` or a small constant/helper for the **$22** floor used alongside `minCollateralUsdForPair` / `minTotalNotionalUsdFromMinMargin`.
- **Specs:** `openspec/specs/signal-detail/spec.md` (requirements for USD input, minimum behavior, and user-facing guidance).
