## Context

The product is a SvelteKit frontend for pair-trading visualization. Users need a shareable, bookmarkable **signal detail** view keyed by a URL slug that encodes two symbols and their allocation weights (e.g. `/signal/ETH:25-SOL:75`). The page composes a primary **signal detail card** that surfaces allocation, price context (candlesticks), narrative, and a trade CTA.

Constraints: Svelte 5 runes, TypeScript, Tailwind + `cn()`, Shadcn-style primitives from `$lib/components/ui`, SSR-friendly routing. Visual language MUST follow [.cursor/rules/design-system-ui-ux.mdc](.cursor/rules/design-system-ui-ux.mdc): serene oceanic theme; cards at **24px** radius, pills at **full** radius; glassmorphism (`backdrop-blur` ~12px, semi-transparent white) for floating layers; primary actions **#22C1EE** on white text; headings/secondary text **#144955** / **#527E88**; soft teal glow shadows; chart series using gradients from **#22C1EE** to **#144955**; interactive elements with subtle hover (brightness or **scale 1.02**).

## Goals / Non-Goals

**Goals:**

- Parse `slug` into `{ tokenA, allocationA, tokenB, allocationB }` with predictable validation rules.
- Render one cohesive signal detail experience: header/summary for the pair split, candlestick chart, entry price, description, **Open position** button.
- Responsive layout: readable chart and tap targets on small viewports; no horizontal overflow from the card.

**Non-Goals:**

- Executing or confirming real trades (button may navigate or emit an event / placeholder action).
- Backend contract finalization (stub or load-friendly types until API exists).
- Full market data pipeline (chart may use mock or minimal OHLC until wired).

## Decisions

1. **Route shape**: Use SvelteKit dynamic segment `[slug]` under `src/routes/signal/[slug]/` so the path is `/signal/ETH:25-SOL:75`. Parsing lives in a small pure module (e.g. `parseSignalSlug`) used by `+page.ts` / `+page.server.ts` and unit-testable.

2. **Slug grammar**: `TOKEN_A:RATIO_A-TOKEN_B:RATIO_B` where tokens are non-empty alphanumeric strings (extend later if needed), ratios are integers 0–100, and the pair order is preserved as in the URL. Malformed slugs: return **404** or dedicated error state per spec (single chosen behavior in implementation).

3. **Component split**: `SignalDetailCard` (presentational) accepts a typed `SignalDetailViewModel` (tokens, allocations, entry, description, chart props or series id). Page route loads/assembles the view model; card stays reusable for future embeds.

4. **Candlestick chart**: Prefer a maintained chart lib compatible with Svelte (e.g. lightweight-charts or similar) if not already present; wrap in a `SignalCandlestickChart` component with fixed min height and responsive width. Styling aligns with design-system gradients and avoids heavy black shadows.

5. **CTA**: Primary pill button (full radius), solid `#22C1EE`, hover per design system; `aria-label` includes pair summary for accessibility.

## Risks / Trade-offs

- **[Risk]** Slug format may need more symbols (e.g. hyphenated tickers) → **Mitigation**: Centralize parser; document allowed charset; extend with tests when product expands.
- **[Risk]** Chart lib adds bundle size → **Mitigation**: Dynamic import of chart module on client-only boundary if SSR is problematic.
- **[Risk]** No API yet → **Mitigation**: Explicit placeholders in load; types/interfaces ready for swap-in.

## Migration Plan

- New route and components only; no data migration. Deploy behind normal release. Rollback: remove route and links.

## Open Questions

- Exact backend fields for description, entry, and OHLC source (endpoint vs static).
- Whether allocations must sum to 100 or can be arbitrary weights (UI can still display as-is).
