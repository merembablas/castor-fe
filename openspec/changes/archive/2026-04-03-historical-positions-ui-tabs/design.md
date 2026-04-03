## Context

The app already appends closed pairs to `castor:historicalPairPositions` (see `historical-pair-positions` capability and `readHistoricalClosedPairPositions`). The `/positions` route today only renders **open** rows merged from active storage + Pacifica, using `PositionListItem` with live marks and **Close position**.

## Goals / Non-Goals

**Goals:**

- Surface historical records on the same `/positions` route via **tabs** (**Active** default, **Historical**) without new pages.
- Reuse the existing card visual language (long/short chips, typography, 24px radius, teal glow) for historical rows.
- On historical cards, replace the **Close position** column with **closed datetime** and **funding paid** (signed USD), with **green** / **red** foreground for positive / negative funding, plus non-color-only cues (sign, label).
- Keep Active tab behavior unchanged in substance: Pacifica merge, reconciliation, mark candles, close flow.

**Non-Goals:**

- Editing or deleting historical records, server sync, or export.
- Changing the historical storage schema or write paths (unless a tiny read-side helper is needed for display labels).
- New navigation routes or standalone “history” pages.

## Decisions

1. **Tabs on the page shell** — Implement **Active** / **Historical** as a segmented control or Shadcn-style tabs above the list (`$lib/components/ui`), wallet gating unchanged: if the user cannot use positions at all, tabs need not appear; if wallet is connected, show tabs and load historical from `localStorage` only on the client (same pattern as active storage).

2. **Component structure** — Prefer extending `position-list-item.svelte` with a `variant: 'active' | 'historical'` (or separate props such as `mode`) **or** a thin `historical-position-list-item.svelte` that shares layout/CSS with the active card. Rationale: one place for long/short row layout reduces drift; if the file becomes unwieldy, split shared “pair header” into a child. **Alternative**: duplicate component — rejected to avoid inconsistent spacing and design-system drift.

3. **Historical row data mapping** — Map `HistoricalClosedPairPosition` to display fields: token labels from the same slug/symbol resolution used elsewhere (e.g. strip perp suffix or use existing normalizers if present); **realized P&L** replaces unrealized block; **opened** from `openedAt`, **closed** from `closedAt`; **notional** at close is not in the stored record — either omit size line for historical or show a clear “—” / hide the line unless a safe derived value exists. **Decision**: show **opened** and **closed** times, **realized P&L** (percent optional if not stored — spec may allow USD-only if percent is not in record); **omit notional** on historical if not in schema to avoid wrong numbers.

4. **Funding placement** — Active rows keep **net funding paid** under unrealized P&L in the main column. Historical rows show **funding paid** only in the **right column** together with **closed** time (no duplicate line under P&L) to match the requested layout and free vertical space.

5. **Ordering** — Sort historical list **newest first** by `closedAt` for scanability.

6. **Accessibility** — Match existing P&L pattern: signed currency, labels, and color as enhancement only.

## Risks / Trade-offs

- **[Risk] Symbol-to-label mapping** may differ slightly from live Pacifica metadata for very old rows → **Mitigation**: use the same string helpers as the rest of the app; fall back to raw symbol if needed.
- **[Risk] SSR/hydration** — Historical reads are `localStorage`-only → **Mitigation**: read in `browser` or `onMount` / `$effect` so the Historical tab does not flash wrong counts on SSR.
- **[Trade-off] No notional on historical cards** until storage adds a field — acceptable per non-goal; document in UI as omitted line.

## Migration Plan

- Ship behind no feature flag: purely additive UI. No data migration.
- Rollback: remove tab UI and historical list branch; active flow unchanged.

## Open Questions

- Whether to show **realized P&L percent** on historical cards when only USD is stored (likely **USD only** unless computed from stored fields).
