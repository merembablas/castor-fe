## Context

Signal detail today uses `MIN_POSITION_ENTRY_TOTAL_USD = 22` in `trade-sizing.ts` and gates **Open position** in `signal-detail-card.svelte` mainly on that total, plus wallet, metadata, prices, and duplicate slug. Leg notionals are already derived as `total * allocationA/100` and `total * allocationB/100` for estimates and execution split.

## Goals / Non-Goals

**Goals:**

- Raise the **product minimum total notional** to **$100**.
- Enforce **$10 minimum estimated notional per leg** (long on A, short on B) for enabling **Open position**.
- Centralize constants (and optional helpers for “minimum total implied by per-leg floor”) in `trade-sizing.ts` so UI and any submit-path checks stay consistent.
- Update on-card copy and defaults so users see **$100** and understand the **$10 per leg** rule where the product shows minimum messaging.

**Non-Goals:**

- Changing allocation math, leverage rules, or Pacifica API contracts.
- Guaranteeing exchange acceptance beyond existing lot/min-order handling (venue may still reject edge cases).

## Decisions

1. **Constants** — Add something like `MIN_POSITION_ENTRY_TOTAL_USD = 100` and `MIN_POSITION_LEG_NOTIONAL_USD = 10` (names aligned with existing style) in `trade-sizing.ts`. Export helpers if useful, e.g. `minTotalForLegFloors(allocationA, allocationB)` returning `max(100, ceil1000/min(allocations))`-style logic so default sync and validation match.

2. **CTA gating** — Extend `openPositionDisabled` in `signal-detail-card.svelte` to require:
   - `totalAmountUsd >= MIN_POSITION_ENTRY_TOTAL_USD` (replace `22`),
   - `estimateLongLegUsd >= MIN_POSITION_LEG_NOTIONAL_USD` and same for short (null-safe when total parses).

   For valid slugs, allocations are positive integers summing to 100; if either allocation were 0, one leg would always be $0—the CTA should remain disabled (already implied by the $10 rule).

3. **Default total when user has not edited** — When auto-setting `totalAmountInputStr`, use **at least** the maximum of **$100** and the **minimum total** that satisfies **both** legs ≥ **$10** (e.g. `max(100, 1000/a, 1000/b)` for integer percentages `a` and `b`). This avoids presenting a default that immediately disables the button on skewed pairs.

4. **Copy** — Replace all **$22** strings in the open-position section with **$100** and add concise hint text for the **$10 per leg** requirement (and optionally the skew case: “increase total” when leg floor drives minimum above $100).

5. **Execution layer** — Prefer a single source of truth: if `execute-pair-trade-client` (or equivalent) can run without the card’s disabled state, add a defensive check using the same constants so submits never bypass product mins. If the only entry point is the disabled CTA, document as optional hardening in tasks.

**Alternatives considered**

- **Only UI disable, no shared helper** — Rejected: skewed allocations need the same formula for defaults and validation; duplicating risks drift.
- **Single combined minimum total constant** — Rejected: $100 total does not imply $10 per leg for very skewed splits; need explicit per-leg check.

## Risks / Trade-offs

- **[Risk] Skewed allocations require total ≫ $100** to reach $10 on the smaller leg → **Mitigation:** Document in UI copy; default sync uses computed floor.
- **[Risk] Spec previously said CTA not disabled for exchange-only mins** — **Mitigation:** Spec delta aligns with product; implementation may still add exchange floor later without contradicting $100/$10.

## Migration Plan

Ship as a normal frontend deploy; no data migration. Rollback: revert constants and gating.

## Open Questions

- None blocking; confirm with product if **single-leg** or **0% allocation** slugs must be supported (current pair model assumes both legs meaningful).
