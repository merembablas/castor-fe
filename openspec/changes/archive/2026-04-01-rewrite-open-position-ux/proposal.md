## Why

Fixed dollar presets ($10 / $20 / $30) for opening a pair position are easy to misread: users may think they are choosing **total notional** when the app treats the value as **USD collateral** that is then multiplied by leverage. That mismatch drives bad sizing expectations and support confusion. Replacing presets with a single amount field defaulting to the **exchange-safe minimum collateral** (derived from min lot/order rules and the current leverage) makes the mental model align with how `splitPairNotionalUsd` and `minCollateralUsdForPair` already work. Showing **margin (collateral) for this order** explicitly, and using a **leverage slider** capped at the **effective max** (minimum of both symbols’ max leverage), makes cost and risk visible before submit.

## What Changes

- Remove **position size presets** ($10, $20, $30, Custom). Replace with **one numeric/text input** for USD collateral; **default** the field to the computed **minimum collateral** required for the pair at the **current** leverage (same basis as today’s “use at least ~$X collateral” hint), and refresh the default when leverage or market/prices change if the user has not overridden it (exact “sticky vs reset” behavior to be finalized in design).
- Add **read-only (or derived) copy** near the controls that states **estimated margin / collateral for this open** (the USD amount the user is allocating to this position—the same quantity used as position size input in trade execution), and optionally **total notional** (`collateral × leverage`) so users see how spend scales with leverage.
- Replace the **leverage `<select>`** with a **slider** (or range input) whose **maximum** is **effective max leverage** (smaller of the two symbols’ `maxLeverage`, already computed in code). **Minimum** is **1×** unless product requires a higher floor; step behavior (every 1× vs coarser steps) is specified in design to balance precision and mobile usability.
- **BREAKING** (spec-level): `signal-detail` requirement **Signal detail provides leverage selection aligned with effective max and five-x steps** is superseded: leverage is no longer required to be a combobox of 5× steps with remainder options.

## Capabilities

### New Capabilities

- _(none — behavior extends existing signal detail and trade sizing.)_

### Modified Capabilities

- `signal-detail`: Update requirements for **position size** entry (no dollar chip presets; single collateral input with min-default behavior), **leverage** control (slider bounded by effective max), and **order-summary copy** (margin/collateral and reactive updates when collateral or leverage changes). Adjust layout/scenario text that referenced preset chips and the leverage select.
- `pacifica-trade-execution`: No change to the collateral × leverage notional formula; optionally add a **non-normative** scenario or cross-reference if specs must mention that displayed “margin” equals the user-entered collateral USD—only if needed for consistency (prefer keeping execution spec unchanged).

## Impact

- **Primary UI**: `src/lib/components/signal-detail-card.svelte` (position state, `positionPreset` / `customAmount` → unified collateral input; leverage binding; new summary line(s); accessibility for slider).
- **Helpers**: `src/lib/signal/pacifica/trade-sizing.js` (reuse `minCollateralUsdForPair`; may add a tiny helper for displaying total notional if not inlined).
- **Leverage options**: `src/lib/signal/pacifica/leverage-options.js` may be simplified or partially replaced if the slider does not need discrete option lists.
- **Specs**: Delta updates under `openspec/specs/signal-detail/spec.md` (and only elsewhere if execution spec is touched).
- **Tests / manual QA**: Open-position disabled states, min-size validation, screen readers and touch targets for the slider on mobile.
