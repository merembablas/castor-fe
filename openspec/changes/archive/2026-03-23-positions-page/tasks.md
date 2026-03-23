## 1. Data model and dummy positions

- [x] 1.1 Add `$lib/positions` module with an `OpenPosition` interface (id, token labels, allocation A/B, `generatedAt`, `openedAt`, `notionalUsd`, `unrealizedPnlUsd`, `unrealizedPnlPercent`) and export `DUMMY_POSITIONS` with exactly three rows—at least one profitable and at least one losing.

## 2. Positions page UI

- [x] 2.1 Implement `src/routes/positions/+page.svelte`: page title and intro copy, `<svelte:head>` title/description, `max-w-3xl` layout aligned with home.
- [x] 2.2 Render the list from `DUMMY_POSITIONS`; each row uses the same card classes as home live-signals (`rounded-[24px]`, border, `bg-white/50`, teal glow shadow, `hover:scale-[1.02]`, focus-visible ring).
- [x] 2.3 For each row, show long (token A) and short (token B) chips with icons and colors matching `src/routes/+page.svelte`, allocation percents, **Generated** and **Opened** datetimes via `Intl.DateTimeFormat`, notional size as `$…`, and unrealized P&L as percent + USD with green/red styling and signed text.
- [x] 2.4 Add a secondary pill **Close position** `type="button"` on the right for `sm+` (`flex`/`justify-between`); stack below content on narrow viewports if needed. Wire as noop or placeholder handler until API exists.

## 3. Polish and verification

- [x] 3.1 Manually verify `/positions` from header nav, active state, no horizontal overflow on a small viewport, and accessibility (keyboard focus on Close, non-color-only P&L cues).
- [x] 3.2 Optionally extract `position-list-item.svelte` if `+page.svelte` becomes hard to read.
