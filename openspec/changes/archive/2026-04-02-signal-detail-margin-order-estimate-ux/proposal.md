## Why

The signal detail open-position controls use **collateral** for both the primary input and copy, but product intent matches **Pacifica**: users think in **total position size (notional)** while **margin** is the capital required at a given leverage. The estimate panel also duplicates the total notional the user already typed, and reported **live updates** for the estimate are unreliable when inputs change. Traders need a clear **per-leg long/short USD** preview alongside margin.

## What Changes

- Replace the primary USD field semantics: it captures **total amount (total notional in USD)**, not margin/collateral.
- Use **margin** in copy (aligned with Pacifica) for the **derived** value: margin = total amount ÷ leverage (read-only in the estimate block).
- Rework the **This order (estimate)** panel: remove redundant **total notional** line (it equals the input); show **margin** only as informational text that **always reflects** the current total amount and leverage; add **estimated long USD** and **estimated short USD** from the signal allocation split on total notional.
- Fix reactivity so the estimate panel updates immediately when total amount or leverage changes (including edge cases with numeric inputs).
- Adjust **minimum sizing** hints and defaults: thresholds and “set to minimum” actions are expressed against **total amount** (e.g. minimum total ≥ minimum margin × leverage at current leverage) while still using existing exchange min/lot logic under the hood.
- Rename internal state/labels where needed (e.g. aria, hints) from collateral-first to total-amount + margin terminology; update user-facing strings that still say “collateral” for this order.

## Capabilities

### New Capabilities

- _(none — behavior is an iteration of existing signal detail / execution sizing)_

### Modified Capabilities

- `signal-detail`: USD control is **total amount**; estimate panel content, terminology (margin vs collateral), reactivity, and long/short USD breakdown.
- `pacifica-trade-execution`: Clarify that the **user-facing position size** is **total notional (USD)**; execution still derives leg notionals from total × allocation with leverage applied per existing `splitPairNotionalUsd` contract (implementation may pass equivalent margin internally).

## Impact

- **UI**: `src/lib/components/signal-detail-card.svelte` (labels, estimate block, validation/min hints, effects/bindings).
- **Sizing helpers**: `src/lib/signal/pacifica/trade-sizing.ts` and call sites — clarify naming/comments; possibly add helpers for min **total** from min margin × leverage; error strings that say “collateral” should say “margin” or “total amount” as appropriate.
- **Trade client**: `execute-pair-trade-client` (or equivalent) — ensure the value sent matches the updated definition (total notional → same leg split as today).
- **Specs**: Delta updates under `openspec/specs/signal-detail/spec.md` and `openspec/specs/pacifica-trade-execution/spec.md`.
