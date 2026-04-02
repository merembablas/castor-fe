## Context

Signal detail (`signal-detail-card.svelte`) loads Pacifica **market metadata** (including `lotSize` and `minOrderSize`) for sizing via `minCollateralUsdForPair` and `planLegSize`. The card currently shows a paragraph listing **lot size** and **min order (base units)** per symbol, plus a second paragraph that nudges users toward the **exchange-derived** minimum total notional at the selected leverage. The product wants a **$22 USD** minimum **entry** (total amount) and **no** user-facing **base-unit** exchange jargon.

## Goals / Non-Goals

**Goals:**

- Define a **product floor** of **$22** on **total position size in USD** (same field as today: total notional for the pair).
- Compute an **effective minimum total notional** as **max($22, exchange-derived minimum total)** at the current leverage, allocations, and marks, so internal behavior stays safe when the exchange needs more than $22.
- **Remove** visible **lot size** and **min order (base units)** lines from the open-position card.
- Replace helper copy with **simple USD messaging** that states **minimum entry is $22**, and when the effective minimum is **above** $22, show **short USD-only** guidance (e.g. suggested total rounded up) **without** mentioning lots or base units.
- Keep **auto-sync** of the total amount when the user has **not** manually overridden the field: default should be **at least** the effective minimum (same pattern as today, but using the new floor).
- **Disable** the **Open position** CTA when total amount is **below** the effective minimum (align UI with spec and avoid pointless API errors).

**Non-Goals:**

- Changing Pacifica API contracts, `planLegSize` rounding rules, or removing `lotSize` / `minOrderSize` from server metadata responses.
- Changing leverage slider rules or the **This order (estimate)** panel (unless a tiny copy tweak is required for consistency).

## Decisions

1. **Single constant for the product floor**  
   **Decision:** Introduce a named constant (e.g. `MIN_POSITION_ENTRY_TOTAL_USD = 22`) in a small shared module (e.g. `trade-sizing.ts` or a dedicated `position-limits.ts` next to trade code) and import it from `signal-detail-card.svelte`.  
   **Rationale:** One source of truth for UI copy, sync logic, and validation.  
   **Alternatives:** Magic number only in the component (harder to test and reuse).

2. **Effective minimum definition**  
   **Decision:**  
   `effectiveMinTotalUsd = max(MIN_POSITION_ENTRY_TOTAL_USD, ceil(minTotalNotionalUsdFromMinMargin(minSuggestedCollateralUsd, leverage)))`  
   when both exchange-derived pieces exist; if exchange-derived is unavailable, treat effective minimum as **$22** only when metadata/prices still allow opening, otherwise keep existing gating.  
   **Rationale:** Satisfies product $22 while preserving correctness when the exchange requires more notional.  
   **Alternatives:** $22 only (risk of avoidable order rejects on illiquid or high-min pairs).

3. **Copy strategy**  
   **Decision:** Always show a short line such as **Minimum entry: $22** (total amount). If `effectiveMinTotalUsd > 22`, add **one** additional USD-only line (suggested total / “increase total amount”) without base units. Remove the existing lot/min paragraph entirely.  
   **Rationale:** Matches “make it simple.”  
   **Alternatives:** Tooltip-only (less discoverable on mobile).

4. **CTA disable**  
   **Decision:** Extend `openPositionDisabled` (or equivalent) so that when `totalAmountUsd` and effective minimum are known, **total < effectiveMinTotalUsd** disables the button (with existing epsilon pattern if reused).  
   **Rationale:** Spec promises blocking below minimum; current UI may not fully gate on exchange min.

## Risks / Trade-offs

- **[Risk]** Exchange minimum could exceed $22 often on some pairs; users only see “$22” prominently and may need the secondary USD line.  
  **Mitigation:** Second line only when `effectiveMinTotalUsd > 22`; keep “Set total amount to ~$X” style action if it already exists, pointed at `effectiveMinTotalUsd`.

- **[Risk]** User enters **$22** but effective minimum is higher—CTA stays disabled.  
  **Mitigation:** Clear short message and one-tap set-to-suggested if we keep that pattern.

## Migration Plan

- Ship as a **frontend-only** change; no data migration.
- **Rollback:** Revert the component and constant; restore prior hint markup.

## Open Questions

- None blocking: copy exact string for “Minimum entry” can be tuned during implementation (e.g. “Minimum entry is **$22** (total amount).”).
