## Why

Traders need a dedicated view of **open positions** alongside live signals: pair legs, sizing, timing, and unrealized P&L at a glance, with a clear path to close. The app header already links to `/positions`, but there is no page yet—this closes that gap with a list UI consistent with the home signal rows and the oceanic design system.

## What Changes

- Add a **Positions** route at `/positions` (reachable from the existing **Positions** nav item) that shows a **vertical list of open positions**.
- Seed the page with **three dummy positions** for development; at least one shows **unrealized profit** and at least one **unrealized loss** (percent and dollar), so green/red styling is visible.
- Each list item includes:
  - **Token A (long)** and **token B (short)** with **allocation ratio in percent**, visually distinct from each other (icons and color), aligned with the home live-signals row pattern.
  - **Datetime generated** (signal or position context as appropriate for the dummy model).
  - **Datetime opened**.
  - **Unrealized P&L** in **percent** and **USD**—high emphasis; **green** for profit, **red** for loss.
  - **Size** used to open the position (e.g. **$5**).
  - A **Close position** control on the **right** of the row (button; wire as UI-only or noop until backend exists).
- **Visual reference**: Reuse the same card/list treatment as `src/routes/+page.svelte` live signal items (rounded cards, teal glow, typography `#144955` / `#527E88`, hover scale ~1.02) and **`.cursor/rules/design-system-ui-ux.mdc`**.

## Capabilities

### New Capabilities

- `positions`: Open-positions list at `/positions`—dummy data, row layout (long/short pair + allocations, generated/opened times, unrealized P&amp;L, notional size, close action), responsive and accessible, styled per design system and home list patterns.

### Modified Capabilities

- _(none)_ — navigation to `/positions` already exists in the live-signals-era UI; this change adds the page and data only.

## Impact

- **Routes**: `src/routes/positions/+page.svelte` (and `+page.ts` / load only if needed for future API).
- **Data**: New module (e.g. `$lib/positions/dummy-positions.ts` or similar) with TypeScript interfaces for position rows; static until a real API exists.
- **Components**: Optional extracted row component if it keeps `+page.svelte` readable; otherwise inline following `+page.svelte` signal list structure.
- **Dependencies**: None beyond existing SvelteKit / Tailwind stack.
