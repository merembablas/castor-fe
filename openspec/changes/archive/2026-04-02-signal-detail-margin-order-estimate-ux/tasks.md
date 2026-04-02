## 1. State, sizing, and execution bridge

- [x] 1.1 In `signal-detail-card.svelte`, treat the primary numeric field as **total notional USD**; rename state (`collateralInputStr` → e.g. `totalAmountInputStr`) and comments for clarity.
- [x] 1.2 Derive **margin USD** as `total / leverage` and use **margin** (not collateral) in user-facing strings for this order; keep account-summary “margin used” wording distinct.
- [x] 1.3 Adjust minimum logic: compare **derived margin** to `minSuggestedCollateralUsd` or equivalently **total** to `minSuggestedCollateralUsd * leverage`; update default sync / “set minimum” to write **minimum total** (ceil as today’s pattern dictates).
- [x] 1.4 In the open-position handler, pass `sizeUsd: totalAmountUsd / selectedLeverage` into `splitPairNotionalUsd` (or refactor per design) so leg targets match the new spec.

## 2. This order (estimate) panel

- [x] 2.1 Remove the redundant **total notional** row from the estimate box; show **margin** only as informational (formatted USD).
- [x] 2.2 Add **long** and **short** leg USD estimates from total × allocation% (same split as execution), with labels tied to token A / token B and long/short roles.
- [x] 2.3 Fix reactivity: ensure margin and leg lines update on every total and leverage change (avoid number-input `bind:value` pitfalls; use explicit input handling if needed).

## 3. Copy, a11y, and hints

- [x] 3.1 Relabel the primary field (and `aria-label` / `aria-labelledby`) to **Total amount (USD)** or agreed product string; update group labels that still say “Collateral”.
- [x] 3.2 Update hint text under the form (minimum sizing, apply-min button) from “collateral” to **total amount** / **margin** per Pacifica alignment.

## 4. Helpers and errors

- [x] 4.1 In `trade-sizing.ts`, clarify JSDoc / names: `minCollateralUsdForPair` remains **minimum margin**; optionally add a small helper for **minimum total** at leverage to avoid duplicated formulas in the card.
- [x] 4.2 Update `planLegSize` error strings that say “Increase collateral” to reference **margin** or **total amount** consistently.

## 5. Specs sync (main tree)

- [x] 5.1 After implementation, fold this change’s deltas into `openspec/specs/signal-detail/spec.md` and `openspec/specs/pacifica-trade-execution/spec.md` during archive (or as part of apply workflow per project convention).

## 6. Verification

- [x] 6.1 Manually verify: change total amount → margin and long/short update immediately; change leverage → margin updates, long+short USD stay equal to total split.
- [x] 6.2 Manually verify: open-position still disabled below exchange minimum; successful path sends leg sizes consistent with pre-change behavior for an equivalent economic scenario (e.g. old $10 @ 10× vs new $100 @ 10×).
