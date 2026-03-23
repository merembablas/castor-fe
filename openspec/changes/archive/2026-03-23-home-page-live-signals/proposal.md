## Why

Users need a clear entry point to discover new trading signals and move into detail views. Today there is no dedicated home experience that surfaces a scannable list with pair context (long/short legs, allocations, timing) and global navigation toward future areas (positions, archives).

## What Changes

- Add a persistent app header with three navigation items: **Live signals** (default / home), **Positions**, and **Archives**. Positions and Archives are placeholders for later routes (visible in nav; implementation can be stub routes or disabled styling per design).
- Implement the home (live signals) view as a vertical list of signals using **three dummy records** for development.
- Each list row is a **link** to the existing signal detail route `/signal/[slug]`, using slugs that match the established pattern (`TOKEN_A:ALLOC_A-TOKEN_B:ALLOC_B`, e.g. `ETH:25-SOL:75`).
- Each row shows **token A (long)** vs **token B (short)** with distinct visual treatment (icons and color), **allocation percentages**, **generated datetime**, and a **single-line description**.

## Capabilities

### New Capabilities

- `live-signals`: Home experience and global nav for the live feed—header with three menus, list of new signals with long/short pair presentation, metadata (time, one-line copy), and navigation into signal detail via valid slugs.

### Modified Capabilities

- _(none)_ — reuses existing `signal-detail` URL contract; no change to signal-detail requirements.

## Impact

- **Routes / layout**: `src/routes/+layout.svelte` (or a shared layout component) for header/nav; `src/routes/+page.svelte` (or equivalent) for the live list.
- **Components**: Reusable signal list row / card using Tailwind (and Shadcn-style UI where applicable); styling **must** follow `.cursor/rules/design-system-ui-ux.mdc` (glass header, radii, teal glow shadows, typography and button tokens, hover ~1.02); optional icons or badges for long vs short legs.
- **Data**: Static or in-memory dummy data until API exists; types should mirror eventual fields (tokens, allocations, generatedAt, description, slug).
- **Dependencies**: None beyond existing SvelteKit stack.
