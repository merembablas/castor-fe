## 1. Types and server load

- [x] 1.1 Update `SignalDetailViewModel` in `src/lib/signal/signal-detail.types.ts`: remove `entryPrice`; replace `generatedAt` with `updatedAt` (ISO string, optional or nullable if no API match) or document a single optional `signalsMeta` shape—align with design.
- [x] 1.2 In `src/routes/signal/[slug]/+page.server.ts`, when `PUBLIC_SIGNALS_API_URL` is set, call `fetchSignalsList` and find a row where `mapSignalsApiRowToLiveSignal(row)?.slug === params.slug`. Merge **long/short** tokens and rounded allocations from that row for the view model when matched; set `updatedAt` from `datetime_signal_occurred`; set `description` via `buildSignalMetricsDescription(z_score, snr)` (optional short chart sentence). Handle no match and API errors without breaking Pacifica load.
- [x] 1.3 Remove hardcoded `generatedAt`, `entryPrice`, and static `description` from the default object; keep sensible fallbacks when API data is absent (per design).

## 2. Detail card UI

- [x] 2.1 In `src/lib/components/signal-detail-card.svelte`, change label **Generated** to **Updated**; bind `<time>` to `updatedAt` when present; hide or replace the timestamp row when absent (match design: small notice vs omit).
- [x] 2.2 Remove the **Entry price** section and any now-unused `priceFormatter` usage tied only to entry.
- [x] 2.3 Ensure long/short `aria-label` and pills reflect API-aligned tokens when the server passes them.

## 3. Chart viewport

- [x] 3.1 In `src/lib/components/signal-candlestick-chart.svelte` (or the minimal parent that owns the chart API), after initial `setData`, set a **visible logical range** (trailing **N** bars + **right padding**) so the **latest** candles sit **left of the extreme right** edge (nearer **center** than `fitContent()` alone). Avoid resetting range on every WebSocket tick once the user has interacted if feasible; at minimum, fix **first paint** behavior.
- [ ] 3.2 Manually verify on desktop and a narrow viewport that recent bars are readable and live updates still append correctly.

## 4. Specs and verification

- [x] 4.1 After implementation, run `pnpm check` (or project equivalent) and fix any type errors from removed `entryPrice`.
- [ ] 4.2 Smoke-test: home → detail with `PUBLIC_SIGNALS_API_URL` pointing at the dev tunnel (full `/signals` URL); confirm **Updated** time, description decimals (≤ 2), no entry price, and chart focus on recent candles.
