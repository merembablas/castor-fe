## Context

- **Current state**: `src/routes/signal/[slug]/+page.server.ts` builds Pacifica-weighted candles correctly from the URL slug but sets **hardcoded** `generatedAt`, `entryPrice`, and a **static** `description`. The UI (`signal-detail-card.svelte`) labels that time **Generated** and renders an **Entry price** block.
- **Home page** already calls the same **signals JSON API** via `fetchSignalsList` + `mapSignalsApiRowToLiveSignal`, which encodes **long first / short second** in the slug and builds Z-score/SNR copy with **≤ 2** decimals (`buildSignalMetricsDescription` in `map-signals-api.ts`).
- **Chart**: `signal-candlestick-chart.svelte` calls `timeScale().fitContent()` once after first data set, which shows the **full** history and pins the **latest** candle at the **right** edge of the viewport.
- **Constraints**: Reuse **`PUBLIC_SIGNALS_API_URL`** (full URL including path, e.g. `https://….ngrok-free.app/signals`). Server-side fetch must use the existing **ngrok** bypass header in `fetchSignalsList`. No new mandatory env var unless product insists on a detail-only URL.

## Goals / Non-Goals

**Goals:**

- Resolve the **active** API row whose **derived slug** equals `params.slug` (same algorithm as the home list), so **long/short** tokens and allocations match the feed.
- Surface **`datetime_signal_occurred`** as **Updated** (label + `<time datetime>`).
- **Remove** entry price from types, load function, and UI.
- Build **description** from **`z_score`** and **`snr`** with the **same** formatting and short explanations as the list (max **two** fractional digits).
- Improve **initial** chart viewport so **recent** candles are not stuck at the far right (e.g. trailing window **centered** or **right-weighted** with empty space / offset—product preference: “latest near **middle**” of the plot area).

**Non-Goals:**

- Changing Pacifica kline/WS behavior, slug grammar, or home list behavior.
- Persisting signals or adding a new backend.
- Full chart pan/zoom UX beyond **initial** visible range (user can still interact if the library allows).

## Decisions

1. **API client reuse**  
   **Decision**: Call `fetchSignalsList(PUBLIC_SIGNALS_API_URL)` from `+page.server.ts` when the env var is set; find `row` such that `mapSignalsApiRowToLiveSignal(row)?.slug === params.slug`.  
   **Rationale**: One HTTP contract, one mapping for long/short and slug shape; avoids duplicating field names and rounding rules.  
   **Alternatives**: Duplicate fetch logic in the route (rejected); new endpoint for single signal (out of scope).

2. **When no row matches**  
   **Decision**: If the API is **unconfigured** or **fails**, keep current **parse-only** behavior for pair/chart from the URL, and show **Updated**/description only when a match exists; otherwise show a compact **inline notice** (e.g. under the header) that the signal is not in the current feed—**do not** fabricate Z-score/SNR or API time. Optional: fallback description = short static line about weighted ratio only.  
   **Rationale**: Avoid lying with dummy metrics; deep links to stale slugs remain viewable for chart exploration.  
   **Alternatives**: 404 if no match (rejected—too harsh for bookmarked URLs); always require API (rejected—breaks local dev without URL).

3. **View model field naming**  
   **Decision**: Replace `generatedAt` with **`updatedAt`** (or keep one ISO field documented as “last update from API”) populated from `datetime_signal_occurred` when matched; remove **`entryPrice`**.  
   **Rationale**: Matches UI copy **Updated** and removes dead data.  
   **Alternatives**: Keep `generatedAt` name with new semantics (rejected—confusing).

4. **Description text**  
   **Decision**: Use `buildSignalMetricsDescription(row.z_score, row.snr)` for the matched row; optionally append one sentence that the chart is **1h weighted ratio** from Pacifica (aligned with existing chart subtitle).  
   **Rationale**: Single formatter guarantees parity with home list decimals and copy.

5. **Chart viewport (TradingView lightweight-charts)**  
   **Decision**: After `setData`, instead of only `fitContent()`, set a **visible logical range** on the time scale so roughly the last **N** bars (e.g. 48–96 for 2–4 days at 1h) are shown, with **`scrollPosition`** or **`setVisibleLogicalRange`** chosen so the **last bar sits nearer the horizontal center** than `fitContent()` produces—e.g. `setVisibleLogicalRange({ from: lastIndex - N, to: lastIndex + rightPaddingBars })` where `rightPaddingBars` adds empty logical space to the **right** of the last bar, pulling the latest candle leftward. Re-run or adjust when `hasFitted` logic changes so **live** updates do not constantly reset user scroll (only **initial** fit / first non-empty data).  
   **Rationale**: Meets “focus on several latest candles” without removing history from the series.  
   **Alternatives**: `fitContent()` + `scrollToRealTime` with large `rightOffset` if API supports it (verify library version); reduce `PACIFICA_INITIAL_HISTORY_MS` (rejected—hurts context).

## Risks / Trade-offs

- **[Risk] Extra latency on detail load** — Second network call (signals list) on every detail view → **Mitigation**: Same payload as home; consider short `cache` headers later if API allows.
- **[Risk] Ngrok / tunnel flakiness** — Already mitigated by header in `fetchSignalsList`; surface existing error pattern as non-fatal for metadata.
- **[Risk] Slug mismatch** — User types allocations that do not match any rounded API row → **Mitigation**: Clarify in UI when not in feed; chart still from URL parse.
- **[Trade-off] Logical range vs. user expectation** — Centering latest bar may show less history initially → **Mitigation**: User can pan on desktop if enabled; document in tasks to verify mobile.

## Migration Plan

- Ship behind no flag: types and UI remove **entry price**; ensure no other imports reference `entryPrice`.
- Deploy with **`PUBLIC_SIGNALS_API_URL`** set in production (already required for home); detail **degrades** gracefully if unset.

## Open Questions

- Exact **N** bars and **right padding** for the chart—tune against real data density and card width.
- Whether **meta.generated_at** should ever be shown alongside row time (proposal uses row **`datetime_signal_occurred`** per user request).
