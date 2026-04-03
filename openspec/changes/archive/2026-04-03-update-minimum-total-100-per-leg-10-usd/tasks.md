## 1. Shared constants and helpers

- [x] 1.1 In `src/lib/signal/pacifica/trade-sizing.ts`, set `MIN_POSITION_ENTRY_TOTAL_USD` to **100** and add `MIN_POSITION_LEG_NOTIONAL_USD = 10` (or equivalent names matching project style).
- [x] 1.2 Add a small exported helper (e.g. `minTotalNotionalForLegFloors(allocationA, allocationB)`) returning the minimum total such that both `total * allocation/100` are ≥ leg minimum, and ensure it is ≥ **100**; use integer allocations from the slug.

## 2. Signal detail UI and gating

- [x] 2.1 In `src/lib/components/signal-detail-card.svelte`, import new constants/helper; extend `openPositionDisabled` so the CTA stays disabled when total **< 100** or **either** `estimateLongLegUsd` / `estimateShortLegUsd` is **< 10** (with null-safe parsing).
- [x] 2.2 Update the `$effect` that sets default `totalAmountInputStr` when the user has not edited the field: use **max(100, minTotalFromLegFloors)** (or equivalent) instead of a bare constant **22**.
- [x] 2.3 Replace user-visible **$22** copy with **$100** total minimum and add concise **$10 per leg** guidance (hint block and any “set total” affordance); align `aria-label` / disabled button messaging if present.
- [x] 2.4 Audit `signal-detail-card.svelte` and related strings for any remaining **22** USD product references tied to minimum entry.

## 3. Trade execution hardening (optional but spec-backed)

- [x] 3.1 In the pair open path (e.g. `src/lib/signal/pacifica/execute-pair-trade-client.ts` or the function that builds/opens orders), assert total ≥ **100** and both allocation-derived leg USD targets ≥ **10** before API calls; on failure return a clear error string for the UI.
- [x] 3.2 Ensure dry-run / debug paths do not bypass product mins unless explicitly intentional and documented.

## 4. Verification

- [x] 4.1 Manually verify: **50/50** slug at **$100** → CTA enabled when other gates pass; **5/95** slug at **$100** → CTA disabled until total raised enough that both legs ≥ **$10**.
- [x] 4.2 Run `pnpm check` (or project equivalent) and fix any TypeScript or Svelte issues from the change.

## 5. Spec merge (after implementation)

- [x] 5.1 When archiving this change, fold `openspec/changes/update-minimum-total-100-per-leg-10-usd/specs/**` deltas into `openspec/specs/signal-detail/spec.md` and `openspec/specs/pacifica-trade-execution/spec.md` per OpenSpec archive workflow.
