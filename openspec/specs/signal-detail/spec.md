## Requirements

### Requirement: Signal URL encodes two tokens and allocations

The system SHALL expose a detail page at `/signal/[slug]` where `slug` matches the pattern `TOKEN_A:ALLOCATION_A-TOKEN_B:ALLOCATION_B`. `TOKEN_A` and `TOKEN_B` SHALL be non-empty strings consisting of alphanumeric characters. `ALLOCATION_A` and `ALLOCATION_B` SHALL be integer percentages in the inclusive range 0–100. The page SHALL interpret the slug as token A with allocation A and token B with allocation B in left-to-right order.

#### Scenario: Valid slug loads detail view

- **WHEN** the user navigates to `/signal/ETH:25-SOL:75`
- **THEN** the system parses token A as `ETH`, allocation A as `25`, token B as `SOL`, allocation B as `75`, and renders the signal detail view with those values

#### Scenario: Malformed slug is rejected

- **WHEN** the user navigates to a path that does not match the required pattern (e.g. missing a segment, non-numeric allocation, or empty token)
- **THEN** the system does not render the signal detail content as valid data and SHALL respond with an appropriate error state (e.g. HTTP 404 or an in-app error boundary) without exposing partial misleading allocations

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

### Requirement: Signal detail presents pair summary, chart, description, and CTA

The signal detail view SHALL display token A and token B with their respective allocations (token A **long**, token B **short** when aligned with the matched API row per the enrichment requirement), a candlestick chart for **weighted two-leg price ratio** context backed by **Pacifica REST kline history and Pacifica WebSocket candle updates** (see `pacifica-weighted-candles` capability), a textual **description**, and a primary control labeled for opening a position. The chart SHALL use default candle **`1h`** interval. The layout SHALL remain usable on narrow viewports (no required horizontal scrolling for the main card content). The view SHALL present distinguishable states when market data is loading, unavailable, or failed (e.g. message or skeleton), without implying that placeholder data is live. The view SHALL display an **Updated** datetime label (not **Generated**) when an API-matched row provides **`datetime_signal_occurred`**. The system SHALL **not** display an **entry price** section or value on the detail page. For the **initial** render with a non-empty series, the chart time scale SHALL emphasize **recent** candles (e.g. visible range focused on the trailing portion of the series so the latest bars are not confined to the extreme right edge of the viewport as with a full-history **fit-only** default). The **vertical** order of the main card content after the chart SHALL be: **description** first; then, when applicable, the **Pacifica account summary** (wallet connected) per the **Signal detail shows Pacifica account summary when wallet is connected** requirement; then **position size** and **leverage** controls per the **Signal detail provides leverage selection** requirement; then the **Open position** (or equivalent) **CTA**.

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

#### Scenario: Account and trading controls follow description

- **WHEN** the user views the signal detail card below the chart
- **THEN** the **description** appears before any **wallet-specific account** summary, and **position size** with **leverage** appear **above** the **Open position** control

### Requirement: Signal detail shows Pacifica account summary when wallet is connected

When a **Solana wallet is connected** and a **wallet public address** is available, the signal detail view SHALL request **Pacifica account info** (documented under **Get Account Info**) for that address and SHALL display **available balance to spend** (using the field or derivation specified by the API and product copy) and **margin usage** as **total margin used relative to account equity**, expressed as a **percentage** such that **100%** means margin used equals equity (maximum stress before liquidation in the user’s framing). This block SHALL appear **below** the textual **description** and **above** the **position size** controls. When the wallet is **not** connected, the system SHALL **not** show this block as live account data. When the request is **in flight**, **fails**, or returns no usable data, the system SHALL show an explicit **loading**, **error**, or **unavailable** state without inventing balances.

#### Scenario: Connected wallet shows balance and margin percent

- **WHEN** the user has connected a wallet and Pacifica account info returns valid **account equity** and **total margin used** (or equivalent mapped fields)
- **THEN** the signal detail page shows **available to spend** and a **margin used** percentage derived from **total margin used** and **account equity**, placed between the **description** and **position size**

#### Scenario: Wallet disconnected hides account summary

- **WHEN** no wallet address is available
- **THEN** the Pacifica account summary block is not shown as authenticated account data

### Requirement: Signal detail provides leverage selection aligned with effective max and five-x steps

The signal detail view SHALL provide a **leverage** control (combobox, select, or equivalent) **alongside** the **position size** control for opening a position. The set of selectable leverage values SHALL be derived from **effective maximum leverage** (per `pacifica-market-metadata`: minimum of both symbols’ max leverage) as follows: include every **positive integer multiple of 5** from **5** up to **effective max** inclusive **while** not exceeding **effective max**; if **effective max** is **not** already in that set, **append** **effective max** as an additional option; if **effective max** is **less than 5**, the only option SHALL be **effective max** (e.g. a single **3x** choice). The default selection SHALL be the **maximum** allowed value unless a different default is required for compliance. While market metadata for **either** symbol is **loading** or **unavailable**, the control SHALL be **disabled** or show a **non-misleading** placeholder state.

#### Scenario: Effective max twenty yields five-x steps through twenty

- **WHEN** effective maximum leverage is **20**
- **THEN** the leverage control includes **5x**, **10x**, **15x**, and **20x**

#### Scenario: Effective max three yields single option

- **WHEN** effective maximum leverage is **3**
- **THEN** the leverage control offers only **3x**

#### Scenario: Effective max twelve includes remainder

- **WHEN** effective maximum leverage is **12**
- **THEN** the leverage control includes **5x**, **10x**, and **12x**

### Requirement: Visual design aligns with project design system

The signal detail page and its card SHALL follow the rules in `.cursor/rules/design-system-ui-ux.mdc`: oceanic teal/blue palette; card corners at 24px radius (or Tailwind equivalent); pill controls at full radius; primary CTA solid `#22C1EE` with white foreground; primary text `#144955` and secondary `#527E88`; soft teal-tinted shadow/glow instead of heavy black shadows; glassmorphism for floating UI where appropriate (`backdrop-filter` blur ~12px with semi-transparent light background); chart coloring using soft gradients between `#22C1EE` and `#144955`; interactive elements SHALL have a hover state that subtly increases brightness or scale to approximately 1.02.

#### Scenario: Primary button matches design system

- **WHEN** the user views the Open position control
- **THEN** it uses pill shape, primary fill `#22C1EE`, white label, and a visible hover affordance consistent with the design system

#### Scenario: Card and typography match design system

- **WHEN** the user views the signal detail card
- **THEN** the card uses the prescribed radius and shadow treatment, and headings/body use the specified high-contrast and secondary text colors
