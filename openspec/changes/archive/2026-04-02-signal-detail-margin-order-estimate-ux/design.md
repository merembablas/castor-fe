## Context

Signal detail (`signal-detail-card.svelte`) currently binds a **Collateral (USD)** field to `collateralInputStr`, treats the parsed value as **margin/collateral**, and derives **total notional** as `collateral × leverage`. `splitPairNotionalUsd` in `trade-sizing.ts` multiplies `sizeUsd` by leverage to produce leg targets—consistent with that model.

Pacifica-facing copy and user mental models treat the typed **position size** as **total notional**, with **margin** = notional ÷ leverage. The **This order (estimate)** panel duplicates total notional and labels the input value as “collateral (margin)”, which is confusing. Users also report the estimate not updating reliably when inputs change (likely `type="number"` / `bind:value` string coercion or conditional rendering gaps).

## Goals / Non-Goals

**Goals:**

- Single numeric field represents **total amount (USD notional)** for the pair; **margin** is read-only, derived as **total ÷ leverage**, with wording aligned to Pacifica (“margin”, not “collateral” for this order).
- **This order (estimate)** shows **margin** (informational), **long leg USD**, and **short leg USD**; **omit** a separate “total notional” line in that box since it matches the input.
- Estimates **react immediately** to total amount and leverage changes.
- Minimum-size logic remains correct: existing `minCollateralUsdForPair` still returns a **minimum margin**; compare against **derived margin** from the user’s total, or equivalently compare **total** against `minMargin × leverage`.
- Trade execution leg notionals stay **mathematically identical** to today for the same economic intent (e.g. old “$10 at 10×” ≡ new “$100 total at 10×”).

**Non-Goals:**

- Changing Pacifica API payloads beyond what is required to keep leg USD targets consistent with the new input semantics.
- Redesigning the leverage slider or account summary block (copy tweaks for “collateral” → “total amount” where it refers to the input only).

## Decisions

1. **Input semantics**  
   - **Decision**: Parse the text field as **total notional USD** (`totalAmountUsd`).  
   - **Execution bridge**: Pass `sizeUsd: totalAmountUsd / leverage` into existing `splitPairNotionalUsd` so `total = sizeUsd × leverage` still equals the user’s total without changing the function’s contract in this change (optional follow-up: rename parameters for clarity).  
   - **Alternative**: Change `splitPairNotionalUsd` to accept `totalNotionalUsd` and stop multiplying by leverage; slightly clearer types but touches more call sites in one pass.

2. **Minimum margin helper**  
   - **Decision**: Keep `minCollateralUsdForPair` as **minimum margin** in USD; derive `minTotalUsd = minMargin × leverage` for defaulting and “below minimum” checks against **total**.  
   - **Rationale**: Reuses proven exchange min/lot math without re-deriving formulas.

3. **Estimate panel contents**  
   - **Decision**: Use `$derived` values: `marginUsd = totalAmountUsd / leverage`, `longUsd` / `shortUsd` = total × allocation% / 100 (same split as `splitPairNotionalUsd` outputs).  
   - **Rationale**: Single source of truth as the UI field; no redundant total row.

4. **Reactivity fix**  
   - **Decision**: Prefer **one-way** `value` + `oninput` (or `bind:value` with explicit string state) so the estimate always reads the same parsed number as submit; avoid relying on number input coercing to empty string in ways that skip updates. Verify the estimate block keys off parsed `totalAmountUsd` and `selectedLeverage` with no stale closures.  
   - **Alternative**: `type="text"` with input filtering—only if number input remains problematic.

5. **Copy / a11y**  
   - **Decision**: Label the field **Total amount (USD)** (or equivalent); use **Margin** in the estimate and hints; reserve “collateral” only if the codebase must match a legacy string somewhere—prefer Pacifica-aligned **margin** for this flow.

## Risks / Trade-offs

- **[Risk] Users familiar with the old field think it is still margin** → **Mitigation**: Clear label and one-line helper under the field (“Margin for this order is shown below”).
- **[Risk] Default/min sync effects overwrite user totals** → **Mitigation**: Preserve `*UserEdited` flag behavior but sync **total** to `ceil(minMargin × leverage)` when auto-filling.
- **[Risk] Floating-point edge cases on margin** → **Mitigation**: Format for display with existing `priceFormatter`; validation uses same thresholds as today with small epsilon where already present.

## Migration Plan

- Ship UI + client changes together; no server migration.  
- **Rollback**: Revert the single card + sizing call path; specs archive stays separate.

## Open Questions

- Exact label string (“Total amount” vs “Position size (USD)” vs “Total notional”)—product copy can be tuned during implementation without affecting math.
