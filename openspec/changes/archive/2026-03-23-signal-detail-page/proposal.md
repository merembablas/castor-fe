## Why

Traders need a dedicated view to inspect a single trading signal (pair allocation, chart context, entry, and narrative) before opening a position. Today there is no route or reusable surface that encodes the signal identity in the URL and presents this information in one cohesive, on-brand layout.

## What Changes

- Add a SvelteKit dynamic route at `/signal/[slug]` where `slug` encodes two tokens and their allocation split (e.g. `ETH:25-SOL:75`).
- Introduce a reusable **signal detail** UI (page + card/component) that shows: token A/B with allocations, a candlestick chart, entry price, description, and a primary **Open position** action.
- Parse and validate the URL segment so invalid or malformed slugs surface a clear error or redirect strategy (exact behavior specified in `signal-detail` spec).
- Apply the project design system (oceanic palette, pill/24px radius, glassmorphism for floating chrome, soft teal glow shadows, chart gradients per `.cursor/rules/design-system-ui-ux.mdc`).

## Capabilities

### New Capabilities

- `signal-detail`: URL-shaped signal identity, parsing rules, page layout, signal detail card content (tokens, allocations, chart, entry, description, CTA), responsiveness, and visual alignment with the design system.

### Modified Capabilities

<!-- No existing specs in openspec/specs/ -->

## Impact

- **Routes**: New `src/routes/signal/[slug]/` (or equivalent) with `+page.svelte` and optional `+page.ts` / load for data.
- **Components**: New signal detail card (and possibly chart wrapper) under `src/lib/components/`.
- **Dependencies**: May add a candlestick chart library or lightweight chart integration if none exists; verify `package.json` before implementation.
- **Navigation**: Any links to “view signal” elsewhere should target `/signal/{encoded-slug}` once implemented.
