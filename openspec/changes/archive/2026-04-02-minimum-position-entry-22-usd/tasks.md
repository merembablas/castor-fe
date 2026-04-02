## 1. Minimum entry constant and effective total

- [x] 1.1 Add a shared constant for the **$22** product minimum total notional (e.g. `MIN_POSITION_ENTRY_TOTAL_USD`) in an appropriate module (e.g. `src/lib/signal/pacifica/trade-sizing.ts` or a small adjacent file), exported for use by signal detail.
- [x] 1.2 Add a helper or clear derived values in `signal-detail-card.svelte` for **exchange-implied minimum total** (existing `minSuggestedTotalUsd`) and **effective minimum total** = `max($22, ceil(exchange-implied))` when computable; document behavior when exchange minimum is null.

## 2. Sync, apply-min, and CTA gating

- [x] 2.1 Update the `$effect` that sets `totalAmountInputStr` when `!totalAmountUserEdited` to use **effective minimum total** instead of only `minTotalNotionalUsdFromMinMargin(minSuggestedCollateralUsd, L)`.
- [x] 2.2 Update `applyMinTotalAmount()` (and any related control) to set the field to **ceil(effective minimum total)**.
- [x] 2.3 Extend `openPositionDisabled` so the **Open position** button is disabled when `totalAmountUsd` is below **effective minimum total** (reuse the same epsilon tolerance pattern as `positionBelowExchangeMin` if appropriate); rename or replace `positionBelowExchangeMin` to reflect **effective** minimum if it simplifies the template.

## 3. Copy and layout (remove lot / base min order)

- [x] 3.1 Remove the paragraph that lists **Lot size** and **Min order (base units)** for each symbol from `signal-detail-card.svelte`.
- [x] 3.2 Replace the remaining minimum guidance with **simple USD copy**: state **minimum entry is $22** (total amount); when **effective minimum total > 22**, show **USD-only** secondary text (and keep or adapt the “set total amount to ~$X” control to target **effective** minimum) without mentioning lots or base units.
- [x] 3.3 Keep `id="order-constraints-hint"` (or equivalent accessibility) valid if referenced by `aria-describedby`; adjust only if markup structure changes.

## 4. Verification

- [x] 4.1 Manually verify on a signal detail page: default total is **≥ $22**; with metadata that implies a minimum **above $22**, CTA stays disabled until total meets **effective** minimum; lot/min base-unit lines are gone.
- [x] 4.2 Run project checks (`bun run check` or equivalent) and fix any TypeScript or Svelte issues introduced by the change.
