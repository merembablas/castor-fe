## 1. Collateral input and state

- [x] 1.1 Remove `PositionPreset`, preset buttons, and conditional “Custom”-only field from `signal-detail-card.svelte`; replace with one always-visible USD collateral input (number/decimal, same validation bounds as today).
- [x] 1.2 Add `collateralUserEdited` (or equivalent) and wire `$effect` / derived logic so default collateral syncs to `minSuggestedCollateralUsd` when the user has not edited, without clobbering manual input.
- [x] 1.3 Replace `positionUsd` derivation to parse only the single collateral field; keep `positionBelowExchangeMin` and `openPositionDisabled` behavior aligned with specs.
- [x] 1.4 Update or replace “Set custom amount…” / `applyMinCollateral` so it fills the unified collateral field and clears or sets the edited flag per design.

## 2. Leverage slider

- [x] 2.1 Replace `leverageSelectStr` + `<select>` with numeric leverage state (integer 1..`effectiveMax`), defaulting to `effectiveMax` when rows load (mirror prior default-to-max behavior).
- [x] 2.2 Implement slider UI (Shadcn `Slider` if present, else styled `<input type="range">`) with `min=1`, `max=effectiveMax`, `step=1`, loading/error/disabled states matching prior select behavior.
- [x] 2.3 Ensure accessibility: label, `aria-valuenow` / `aria-valuetext` (e.g. “12x”), keyboard operable on mobile and desktop.
- [x] 2.4 Remove or narrow unused `buildLeverageOptions` usage; delete dead code in `leverage-options.js` only if nothing else imports it.

## 3. Margin and notional display

- [x] 3.1 Add a compact summary block (below inputs or beside CTA) showing **Collateral (this order)** and **Total notional** (`collateral × leverage`) using existing `priceFormatter` / tabular nums; hide or placeholder until `positionUsd` and `selectedLeverage` are valid.
- [x] 3.2 Copy MUST distinguish per-order lines from account “margin used %” already in the account section.

## 4. Copy, layout, and QA

- [x] 4.1 Update `aria-label` on the open button and any group labels that still say “preset” or “position size” to “collateral” / “margin” where it reduces confusion.
- [x] 4.2 Verify footer order still matches spec: description → account → collateral + leverage → summary → CTA.
- [x] 4.3 Manual pass: change leverage and collateral, confirm totals update, submit disabled below min, effective max = min of both symbols, mobile touch on slider.
