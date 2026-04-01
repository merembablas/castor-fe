## Context

Open position UX lives in `signal-detail-card.svelte`. Today users pick **$10 / $20 / $30** or **Custom** for “position size,” then choose leverage from a **`<select>`** built by `buildLeverageOptions(effectiveMax)` (5× steps plus remainder). Trade execution (`splitPairNotionalUsd`, `pacifica-trade-execution` spec) treats the size field as **USD collateral** multiplied by leverage to get **total notional**. Minimum viable collateral is already computed via `minCollateralUsdForPair` in `trade-sizing.ts` and surfaced as copy + “Set custom amount…” when below minimum. Effective max leverage is already `min(maxLeverage_A, maxLeverage_B)` via `effectiveMaxLeverage`.

## Goals / Non-Goals

**Goals:**

- Single **collateral** input whose **default** matches the **minimum collateral** needed for the pair at the **current** leverage (same mathematical basis as `minCollateralUsdForPair`), reducing confusion versus arbitrary dollar chips.
- Always-visible **estimated margin (collateral)** and **total notional** (`collateral × leverage`) that **react** to input and slider changes so users see what they are spending before submit.
- **Leverage** controlled by a **slider** (native `<input type="range">` or Shadcn `Slider` if already in the project) with **max = effective max leverage** (smallest of the two symbols’ maxima).
- Mobile-friendly hit targets and accessible names/values for the slider (`aria-valuemin`, `aria-valuemax`, `aria-valuenow`, live region or `aria-valuetext` for “12x”).

**Non-Goals:**

- Changing Pacifica APIs, agent signing, or the **collateral × leverage → notional** formula.
- Portfolio-level margin simulation (only **this** pending order).
- Replacing account-level “margin used % vs equity” in the account block.

## Decisions

1. **Default collateral when leverage or market data changes**  
   **Decision:** Track a boolean `collateralUserEdited` (or equivalent). While `false`, whenever `minSuggestedCollateralUsd` becomes available or **materially changes** (e.g. leverage slider moved), set the input string to a **display-safe default** (e.g. `ceil(minSuggestedCollateralUsd, 2)` or existing formatter). After the user types or blurs with a value that differs from the programmatic default, set `collateralUserEdited` to `true` and **do not** overwrite their value on leverage changes (they chose a size; changing leverage may still enable/disable submit via existing `positionBelowExchangeMin`).  
   **Alternatives:** Always reset on leverage change (annoying); never auto-update after first paint (undermines “default to min” when tuning leverage).

2. **Slider step and range**  
   **Decision:** Integer leverage from **1** through **effective max** inclusive, **step 1**. Matches Pacifica integer leverage updates and avoids reintroducing arbitrary 5×-only grids.  
   **Alternatives:** Step 5 only (rejected: user asked for a slider, not discrete 5× chips); continuous float (rejected: API/leverage is integer).

3. **“Margin used” copy**  
   **Decision:** Label clearly **“Collateral (this order)”** or **“Margin for this position”** and show the **same numeric value** as the validated collateral input (USD). Add a second line **“Total notional”** = `collateral × leverage` so leverage changes visibly scale exposure.  
   **Alternatives:** Only show one number (insufficient when leverage changes).

4. **Implementation surface for slider**  
   **Decision:** Prefer **`$lib/components/ui`** slider if present; else **native range** styled with Tailwind to match the card (teal track/thumb, focus ring).  
   **Alternatives:** Custom div-based slider (more work, same outcome).

5. **Removal of `buildLeverageOptions` usage**  
   **Decision:** Slider reads `effectiveMax` directly; **remove** or **narrow** `leverageSelectStr` → store **number** state `leverage` defaulting to `effectiveMax` when metadata loads (mirror current “default max” behavior). Keep `effectiveMaxLeverage` helper.

## Risks / Trade-offs

- **[Risk] Default collateral overwrites user intent** → Mitigation: `collateralUserEdited` gate; optional “Reset to minimum” link reusing today’s `applyMinCollateral` pattern.
- **[Risk] Slider hard to set exact max on mobile** → Mitigation: large thumb, optional numeric readout beside slider, ensure `max` attribute matches effective max.
- **[Risk] Min collateral spikes when prices move** → Mitigation: same as today—recompute derived min; if user is below min, disable submit and show existing hint.
- **[Trade-off]** Integer 1×–max slider may have many stops on very high max (e.g. 50×)—acceptable; keyboard/page up-down still work on native range.

## Migration Plan

- Ship as a **frontend-only** change; no data migration.
- **Rollback:** revert `signal-detail-card` and any new UI helper; restore prior select + presets.

## Open Questions

- Whether to **re-sync** default collateral to new min when user changes leverage **only if** current input still equals the **previous** programmatic default (more complex but avoids clobbering “coincidentally equal” user values)—can be deferred to implementation if `collateralUserEdited` is sufficient.
