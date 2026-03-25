## Why

The signal detail route (`/signal/[slug]`) still shows placeholder **generated** time, a fixed **entry price**, and a generic **description** while Pacifica chart data is real. The home page already loads the same **signals** HTTP API and maps **long/short** legs and metrics consistently; detail should use that source of truth so timestamps, copy, and leg labels stay aligned with the active list. Users also struggle to read **recent** candles because the chart fits the **entire** history, pinning the latest bar to the far right.

## What Changes

- Load the configured **signals list API** (same base URL pattern as home, e.g. full URL including `/signals`) on the signal detail **server load**, and **resolve the row** whose list-derived **slug** equals the current route `slug` (same mapping as `mapSignalsApiRowToLiveSignal`: **token A = long**, **token B = short**, integer allocations from `alloc_*_pct` rounded per symbol).
- Replace the header datetime label **Generated** with **Updated**; set the displayed value from the matched API row’s **`datetime_signal_occurred`** (ISO string from the API). If the URL slug has **no** matching active row, keep a defined fallback (e.g. omit secondary line, show a short “not in current feed” note, or retain parse-only behavior—implementation follows design).
- **Remove** the **Entry price** section and its value from the detail card and from the view model type as needed.
- Set **description** from **Z-score** and **SNR** on the matched row: reuse the same formatting rules as the home list (**≤ 2** decimal places, brief plain-language explanations). Optionally append one short sentence on weighted ratio / chart context if product wants extra clarity.
- Adjust the **candlestick chart** time scale so **recent** bars are easier to see: e.g. initial visible range that **centers** the latest candles or applies a modest **zoom** on the trailing window instead of a single `fitContent()` over the full series (still support live updates / WebSocket).

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `signal-detail`: Detail page requirements change—remove entry price as a required element; require **Updated** time and API-backed description when a matching list row exists; clarify alignment with **signals API** long/short semantics; optional chart **viewport** behavior for recent candles.

## Impact

- `src/routes/signal/[slug]/+page.server.ts` — fetch signals list, match slug, merge into `SignalDetailViewModel`.
- `src/lib/signal/signal-detail.types.ts` — drop `entryPrice`; rename or repurpose `generatedAt` → **`updatedAt`** (or keep field name with documented meaning); ensure description source is clear.
- `src/lib/components/signal-detail-card.svelte` — label **Updated**, remove entry block, remove unused price formatter if only used for entry.
- `src/lib/components/signal-candlestick-chart.svelte` (and/or parent) — time scale / visible range for **recent** focus.
- **Environment**: reuse **`PUBLIC_SIGNALS_API_URL`** (or document if detail needs a separate override—prefer single variable).
- **External**: same JSON API as home (`data[]` with `z_score`, `snr`, `token_long`, `token_short`, `datetime_signal_occurred`, allocations, etc.); ngrok hosts still need bypass header (already in `fetchSignalsList`).
