## 1. Page structure and data loading

- [x] 1.1 Add **Active** / **Historical** tabs (or segmented control) to `src/routes/positions/+page.svelte`, defaulting to Active; ensure wallet/unavailable states still behave per existing rules.
- [x] 1.2 On the client, load historical records via `readHistoricalClosedPairPositions()`, sort by `closedAt` descending, and bind to reactive state; avoid SSR/localStorage mismatch (read only in browser).
- [x] 1.3 Wire Active tab to existing merged rows, marks, close handlers, and empty states without regressions.

## 2. Historical list item UI

- [x] 2.1 Implement a historical card (extend `position-list-item.svelte` or add a sibling) that matches active long/short layout, allocations, opened/closed datetimes, and realized P&L (`realizedPnlUsd`) with green/red/neutral styling and signed USD (no live/pending P&L).
- [x] 2.2 Remove **Close position** on historical rows; use the right column for **Funding paid** (`fundingPaidUsd`) and **closed** datetime, with green for positive funding and red for negative, plus explicit sign/label.
- [x] 2.3 Omit the duplicate **net funding paid** line under P&L on historical rows (funding only in the right column per spec); omit **notional size** if not present on stored records.
- [x] 2.4 Resolve human-readable token labels from `longSymbol` / `shortSymbol` / slug using existing project helpers where possible.

## 3. Design system and a11y

- [x] 3.1 Apply design-system radii, colors, shadows, and hover ~1.02 on list cards and interactive tab triggers; keep keyboard focus-visible on tabs and Close (Active only).
- [x] 3.2 Verify layout on narrow viewports (stacked right column, readable text, no horizontal overflow).

## 4. Verification

- [x] 4.1 Add or extend tests (component/unit) for historical sorting, funding sign styling classes or formatted output, and empty Historical tab.
- [x] 4.2 Manually verify: Active tab unchanged (marks, close, funding under P&L); Historical tab lists cached closes; funding colors match sign.
