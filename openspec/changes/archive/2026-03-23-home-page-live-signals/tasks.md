## 1. Types and dummy data

- [x] 1.1 Add a `LiveSignal` interface (slug, tokens, allocations, `generatedAt`, one-line `description`) in an appropriate `$lib` module
- [x] 1.2 Export an array of exactly three dummy `LiveSignal` records with valid slugs (e.g. `ETH:25-SOL:75`, `BTC:40-AVAX:60`, `ARB:33-MATIC:67`) and realistic metadata

## 2. App shell and navigation

- [x] 2.1 Update root `+layout.svelte` to include a header with three links: Live signals (`/`), Positions (`/positions`), Archives (`/archives`)
- [x] 2.2 Implement active-nav styling using current pathname (`$app/state` or equivalent) with correct handling for `/` vs other routes
- [x] 2.3 Style the header per `.cursor/rules/design-system-ui-ux.mdc`: glassmorphism (blur ~12px, `rgba(255, 255, 255, 0.4)`), oceanic palette, pill nav items, typography `#144955`/`#527E88`, spacing, and mobile-friendly horizontal layout

## 3. Live signals list (home)

- [x] 3.1 Replace `src/routes/+page.svelte` with a live-feed layout that maps dummy data to list rows
- [x] 3.2 Implement each row as a link (or link-wrapped card) to `/signal/{slug}` with full keyboard/focus affordance
- [x] 3.3 Per row, render token A (long) and token B (short) with distinct icons/badges and color accents, show both allocation percentages, formatted `generatedAt`, and single-line description
- [x] 3.4 Add hover/focus states on rows consistent with design system (subtle scale or brightness ~1.02)
- [x] 3.5 Apply **24px** card radius and **soft teal glow** shadow on list surfaces (no heavy black shadows), per design system

## 4. Placeholder routes

- [x] 4.1 Add `src/routes/positions/+page.svelte` with minimal placeholder content and page title
- [x] 4.2 Add `src/routes/archives/+page.svelte` with minimal placeholder content and page title

## 5. Verification

- [x] 5.1 Manually verify all three dummy links open valid signal detail pages without parse errors
- [x] 5.2 Spot-check narrow viewport: no horizontal overflow for header and list; tap targets adequate
- [x] 5.3 Confirm header glass, radii, shadow, text colors, and hover ~1.02 match `design-system-ui-ux.mdc` (and the live-signals spec)
