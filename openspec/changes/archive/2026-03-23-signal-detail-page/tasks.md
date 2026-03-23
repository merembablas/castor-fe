## 1. Slug parsing and types

- [x] 1.1 Add `parseSignalSlug(slug: string)` (pure function) returning parsed tokens and allocations or a discriminated error; document allowed charset and 0–100 integers per spec
- [x] 1.2 Define `SignalDetailViewModel` interface (tokens, allocations, entryPrice, description, chart series props or placeholder flag) in `src/lib` for page and card

## 2. Route and data loading

- [x] 2.1 Create `src/routes/signal/[slug]/+page.svelte` (and `+page.ts` or `+page.server.ts`) that validates slug via parser and returns 404 (`error(404)`) on invalid input
- [x] 2.2 Wire placeholder or future load data for entry, description, and OHLC (stub acceptable) into the view model

## 3. Signal detail UI

- [x] 3.1 Implement `SignalDetailCard` (or equivalent) showing pair summary, entry price, description, and primary **Open position** CTA; use Tailwind + `cn()`, apply `.cursor/rules/design-system-ui-ux.mdc` (24px card radius, pill CTA `#22C1EE`, colors `#144955` / `#527E88`, soft teal shadow, hover scale ~1.02)
- [x] 3.2 Add `SignalCandlestickChart` wrapper with responsive min-height/width; style series with gradient from `#22C1EE` to `#144955`; use client-only or dynamic import if library requires `window`
- [x] 3.3 Add chart dependency only if missing (`package.json` check), following design doc choice

## 4. Accessibility and QA

- [x] 4.1 Ensure semantic structure, focus styles, and descriptive `aria-label` on the Open position control (include pair summary)
- [x] 4.2 Manually verify `/signal/ETH:25-SOL:75` and a malformed slug; confirm mobile layout without horizontal scroll on the main card
