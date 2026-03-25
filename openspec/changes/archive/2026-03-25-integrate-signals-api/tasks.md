## 1. Configuration and API client

- [x] 1.1 Add environment variable for signals list URL (full URL including `/signals` path) and document it in `.env.example` if the project uses one
- [x] 1.2 Add TypeScript interfaces for the API response (`data` items with `z_score`, `snr`, `token_long`, `token_short`, `symbol_a`, `symbol_b`, `alloc_a_pct`, `alloc_b_pct`, `datetime_signal_occurred`, plus `meta`) in `src/lib/live-signals/` (or adjacent module)
- [x] 1.3 Implement a server-side fetch helper that requests JSON, handles non-OK HTTP, and optionally sets headers needed for ngrok-free hosts (e.g. skip-browser-warning) per design

## 2. Mapping and presentation helpers

- [x] 2.1 Implement mapping from one API row to list fields: long/short tokens, `Math.round` allocations per `symbol_a`/`symbol_b` match to long/short, slug `LONG:allocL-SHORT:allocS`, and skip or guard rows that fail `parseSignalSlug` rules
- [x] 2.2 Implement description text (or formatter) that includes Z-score and SNR with at most two decimal digits each and brief plain-language explanations for both metrics
- [x] 2.3 Format `datetime_signal_occurred` for the row timestamp (reuse or align with existing `Intl.DateTimeFormat` usage on the home page)

## 3. Home route integration

- [x] 3.1 Add `+page.server.ts` (or extend existing load) on `/` to call the fetch helper and return `{ signals, error, empty }` (or equivalent) for the page
- [x] 3.2 Update `+page.svelte` to consume loaded data: loading UI, error UI, empty state, and list rows linking to `/signal/[slug]` without importing `DUMMY_LIVE_SIGNALS` for production
- [x] 3.3 Keep list row styling and long/short visual distinction aligned with `design-system-ui-ux` and existing live-signals layout

## 4. Cleanup and verification

- [x] 4.1 Retain `DUMMY_LIVE_SIGNALS` only for tests/dev if still useful, or remove unused imports; ensure TypeScript and linter pass
- [x] 4.2 Manually verify against the configured API: rows appear, allocations are integers, Z-score/SNR show ≤2 decimals, slugs open detail pages
- [x] 4.3 Run project checks (`npm run check` or equivalent) and fix any regressions
