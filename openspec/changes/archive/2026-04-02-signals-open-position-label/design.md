## Context

Live signals on `/` are rendered as navigable cards keyed by the same **slug** string used for `/signal/[slug]` and for **`castor:activePairPositions`** (`ActivePairPosition.slug`). The module `src/lib/signal/active-pair-positions.ts` already exposes **`readActivePairPositions`**, **`isSlugActive(slug)`**, and write helpers used when opening/closing pairs. The positions page reconciles storage with Pacifica; the home list does not need Pacifica for this feature—**cache membership alone** is the product signal for “you already tracked an open pair for this slug,” matching the user request.

## Goals / Non-Goals

**Goals:**

- Show a compact, on-brand **pill/badge** on a live signal card when that row’s slug **`isSlugActive`** is true.
- Use **icon + short label** (e.g. “Open position” or “Position open”) per design-system-ui-ux: pill radius, oceanic colors (`#22C1EE` / `#B9E9F6` / `#144955` / `#527E88`), no heavy black shadow; optional soft teal glow consistent with other chips.
- Update the badge when **`localStorage`** for `castor:activePairPositions` changes (same tab writes, and **`storage`** event for other tabs) so the UI stays honest without a full reload.

**Non-Goals:**

- Proving exchange-open state on the home page (that remains `/positions` + Pacifica reconciliation).
- Changing when slugs are written or removed from storage.
- Showing count of legs or P&L on the card (link to `/positions` or detail is enough if we add copy later).

## Decisions

1. **Membership check** — Use **`isSlugActive(rowSlug)`** (exact string match after trim) where `rowSlug` is the same value used for `href` to signal detail. **Rationale:** Single source of truth with positions flow; already implemented and tested patterns.

2. **Where to wire state** — Prefer a small **Svelte 5** reactive helper or store that mirrors “set of active slugs” derived from `readActivePairPositions()` and refreshes on `storage` + after local mutations if the app opens a position and returns to home without a storage event from another tab. **Rationale:** Avoid calling `readActivePairPositions()` in a tight loop per card without memoization; a derived `$state` / `$derived` map or Set keyed by slug keeps list renders cheap.

3. **SSR / hydration** — `localStorage` is unavailable during SSR. **Rationale:** Default to **no badge** until browser `onMount` or a client-only guard; no flash requirement in spec beyond “when cache says active, show label.”

4. **Visual treatment** — **Secondary / ghost pill**: e.g. semi-transparent `#B9E9F6` or light border `#22C1EE`, text `#144955` or `#527E88`, **Lucide** (or existing icon set) icon such as **LineChart**, **CircleDot**, or **Briefcase** sized for inline use—aligned with long/short badges on the same card. **Rationale:** Primary solid `#22C1EE` is reserved for main CTAs; this is informational.

5. **Placement** — Near the **card header** or **meta row** (alongside time / pair summary) so it is visible before the news teaser, without crowding Z-score/SNR. **Rationale:** Scannable at a glance; implementation can follow existing flex/grid on the signal card component.

## Risks / Trade-offs

- **[Risk] Slug in storage but legs closed on exchange** — User still sees “open” until `/positions` reconciliation prunes storage → **Mitigation:** Accept per product; copy MAY say “Tracked open” vs “Open on exchange” if we want honesty later (out of scope unless copy change is approved).

- **[Risk] Stale UI in same tab** — If something removes a slug without going through helpers, badge might linger → **Mitigation:** All mutations should use `active-pair-positions` helpers; optional `storage` event only fires for other tabs—same-tab updates need explicit reactive refresh after writes (e.g. invalidate store when returning to `/`).

- **[Risk] Layout shift on mobile** — Extra chip wraps → **Mitigation:** Pill uses short text; flex-wrap already acceptable per live-signals layout.

## Migration Plan

Not applicable (client-only UI read of existing storage).

## Open Questions

- Final **microcopy** (“Position open” vs “Active trade” vs “In portfolio”)—pick one short string during implementation for consistency with tone elsewhere.
