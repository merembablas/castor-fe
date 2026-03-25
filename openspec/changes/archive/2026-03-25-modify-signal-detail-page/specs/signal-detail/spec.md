## ADDED Requirements

### Requirement: Signal detail enriches from the signals list API when the slug matches an active row

When **`PUBLIC_SIGNALS_API_URL`** is configured, the signal detail **server load** SHALL request the same signals list JSON API used by the home page. The system SHALL locate a response row whose **mapped slug** (long token, rounded long allocation, short token, rounded short allocation—same rules as the home list) equals the route **`slug`**. When such a row exists, the detail view SHALL use that row’s **`token_long`** / **`token_short`** and rounded allocations as the **long** and **short** legs for labels and SHALL use **`datetime_signal_occurred`** as the **updated** timestamp and **`z_score`** / **`snr`** for the **description** text per the metrics formatting requirement below. When no row matches, the system SHALL still parse the URL slug for chart and pair display if the slug is valid, and SHALL NOT invent API timestamps or metrics.

#### Scenario: Matching active row supplies metadata

- **WHEN** the signals API returns a row that maps to the same slug as the current route
- **THEN** the detail page shows **Updated** with the row’s **`datetime_signal_occurred`**, a description that includes **Z-score** and **SNR** each with at most **two** fractional decimal digits and brief plain-language explanations, and long/short labels consistent with **`token_long`** and **`token_short`**

#### Scenario: API missing or no matching row

- **WHEN** the signals API is not configured, fails, or returns no row matching the route slug
- **THEN** the detail page does not display API-sourced Z-score, SNR, or API datetime as if they were valid for that signal, and the chart may still load from the URL slug when Pacifica data is available

### Requirement: Signal detail description includes Z-score and SNR with bounded decimals

When description content is derived from the signals API row, the system SHALL format **Z-score** and **SNR** with **at most two** digits after the decimal separator and SHALL include a **brief** explanation for each metric (e.g. spread deviation from typical range; signal strength relative to noise). The copy SHALL remain readable on typical mobile widths (wrapping is acceptable).

#### Scenario: Metrics formatting

- **WHEN** the matched API row provides `z_score` and `snr`
- **THEN** the rendered description uses those values rounded or formatted to at most two decimal places each and includes short explanatory phrasing for both

## MODIFIED Requirements

### Requirement: Signal detail presents pair summary, chart, entry, description, and CTA

The signal detail view SHALL display token A and token B with their respective allocations (token A **long**, token B **short** when aligned with the matched API row per the enrichment requirement), a candlestick chart for **weighted two-leg price ratio** context backed by **Pacifica REST kline history and Pacifica WebSocket candle updates** (see `pacifica-weighted-candles` capability), a textual **description**, and a primary control labeled for opening a position. The chart SHALL use default candle **`1h`** interval. The layout SHALL remain usable on narrow viewports (no required horizontal scrolling for the main card content). The view SHALL present distinguishable states when market data is loading, unavailable, or failed (e.g. message or skeleton), without implying that placeholder data is live. The view SHALL display an **Updated** datetime label (not **Generated**) when an API-matched row provides **`datetime_signal_occurred`**. The system SHALL **not** display an **entry price** section or value on the detail page. For the **initial** render with a non-empty series, the chart time scale SHALL emphasize **recent** candles (e.g. visible range focused on the trailing portion of the series so the latest bars are not confined to the extreme right edge of the viewport as with a full-history **fit-only** default).

#### Scenario: Required content is visible

- **WHEN** the signal detail page is shown for a valid slug
- **THEN** the user sees token A and B with their allocation percentages, a candlestick chart region fed by the weighted ratio series when data is available, a description, and an **Open position** (or equivalent) action, and does not see an entry price

#### Scenario: Mobile-friendly layout

- **WHEN** the viewport is narrow (typical mobile width)
- **THEN** the chart and controls remain readable and tappable without breaking the primary card layout

#### Scenario: Chart reflects live weighted ratio

- **WHEN** Pacifica data is successfully loaded for both symbols
- **THEN** the candlestick chart displays synthetic OHLC derived from the weighted ratio formula with long/short exponents from the slug allocations and updates as WebSocket candle messages arrive

#### Scenario: Data failure is visible

- **WHEN** Pacifica REST or WebSocket data cannot be obtained for one or both symbols
- **THEN** the chart area shows an explicit loading or error state and does not present fabricated live candles

#### Scenario: Updated time label

- **WHEN** a matching signals API row is available for the slug
- **THEN** the header shows **Updated** and a formatted time derived from **`datetime_signal_occurred`**

#### Scenario: Recent candles are visible in the initial viewport

- **WHEN** the chart has loaded a non-empty candle series
- **THEN** the default visible time range focuses on recent bars such that the latest candles are not only at the far right edge of the chart area (e.g. trailing window with horizontal padding)
