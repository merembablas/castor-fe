## Why

Live signal rows show quantitative context (Z-score, SNR) but not qualitative market narrative. A per-symbol news feed lets users quickly see what is moving each leg without leaving the list. The backend already exposes aggregated summaries by symbol; surfacing them on the signal card closes that gap.

## What Changes

- Fetch symbol-keyed news from a configurable HTTP endpoint (defaulting to the provided `/news` API shape: `data[]` with `symbol`, `last_updated`, and nested `elfa.data[]` items each with `summary` and `sourceLinks`).
- On each **live signal list row** (signal card), show **at most one short sentence of context per leg** (long and short symbols)—derived from the first available summary for that symbol, trimmed or condensed so it reads as a single line on the card (not the full multi-sentence API text inline).
- Add a **secondary** control (e.g. “View news” / “All summaries”) that opens an **in-place overlay** (dialog, drawer, or sheet) listing **all** summary bullets returned for **both** symbols on that signal, with optional source links, **without** navigating to a new route.
- Reuse loading/error patterns consistent with other list fetches; do not block the whole page if news fails—degrade gracefully on the card.
- Style overlays, buttons, and typography per **design-system-ui-ux** (oceanic palette, 24px cards, pill controls, glass-style overlay panel, teal glow).

## Capabilities

### New Capabilities

- `symbol-news`: Configuration and behavior for loading and normalizing per-symbol news from the news HTTP API (including success/empty/error handling and mapping symbols to summary items).

### Modified Capabilities

- `live-signals`: Extend live signal row/card requirements to include the per-symbol news teaser (one sentence per symbol max on the card), the control to open the full-summaries overlay for that row’s symbols, and design-system conformance for the new UI.

## Impact

- **Code**: Home route (`src/routes/+page` or shared signal list components), possible new `$lib` module for news types and fetch helpers, env/config for news base URL (similar to signals API).
- **APIs**: New client integration with external `/news` JSON (ngrok URL in dev; production URL via env).
- **Dependencies**: None beyond existing SvelteKit fetch, UI primitives (e.g. Dialog/Sheet from `$lib/components/ui` if present).
- **UX**: Additional async content on list rows; focus trap and escape to close on overlay per accessibility best practice.
