## 1. Configuration and archives API client

- [x] 1.1 Add `PUBLIC_ARCHIVES_API_URL` (full URL including `/archives` path) and document it in `.env.example` if the project uses one
- [x] 1.2 Add TypeScript interfaces for the archives API response: `data` items include `z_score_end`, `snr_end`, `datetime_signal_archived`, `datetime_signal_occurred`, `token_long`, `token_short`, `symbol_a`, `symbol_b`, `alloc_a_pct`, `alloc_b_pct` (and optional start metrics if present), plus `meta` if returned
- [x] 1.3 Implement server-side `fetchArchivesList` (mirror `fetchSignalsList`): JSON parse, non-OK handling, optional `ngrok-skip-browser-warning` header for tunnel hosts

## 2. Mapping and view model

- [x] 2.1 Map each archives row to list fields using the same slug/allocation rules as live signals (`mapSignalsApiRow` pattern); omit rows that fail `parseSignalSlug`
- [x] 2.2 Build description text from `z_score_end` and `snr_end` with ≤2 decimal places each and brief explanations (reuse or extend `buildSignalMetricsDescription`-style helper)
- [x] 2.3 Expose `archivedAt` (from `datetime_signal_archived`) and `generatedAt` / occurred time (from `datetime_signal_occurred`) on the row view model for the template

## 3. Archives route integration

- [x] 3.1 Add `src/routes/archives/+page.server.ts` to read `PUBLIC_ARCHIVES_API_URL`, call fetch helper, return configured/error/empty/list flags consistent with home naming (e.g. `archivedSignals`, `archivesError`, `archivesConfigured`, `archivesEmpty`)
- [x] 3.2 Replace `archives/+page.svelte` placeholder with list UI matching home: skeleton while navigating or loading, error/not-configured/empty states, cards linking to `/signal/[slug]`, long/short badges, occurred + archived timestamps, metrics description line
- [x] 3.3 Align styling with live-signals design system (24px radius, teal shadow, hover scale, `#144955` / `#527E88` text)

## 4. Cleanup and verification

- [x] 4.1 Run `npm run check` (or project equivalent) and fix issues
- [x] 4.2 Manually verify with the configured archives API: rows, end z-score/SNR formatting, archived datetime visible, slugs open detail
- [x] 4.3 After implementation, archive this change per project OpenSpec workflow if required
