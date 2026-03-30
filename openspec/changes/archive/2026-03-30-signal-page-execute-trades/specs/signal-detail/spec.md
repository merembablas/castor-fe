## ADDED Requirements

### Requirement: Signal detail tracks active pair positions in browser storage

The system SHALL maintain a **persistent list** of **active pair positions** in **browser storage** using an application-defined storage key. Each stored entry SHALL include at minimum the **route slug** string identifying the pair signal (e.g. `SOL:20-ETH:80`) and MAY include a timestamp of when the position was opened. The system SHALL read this list when rendering the signal detail view for a slug and SHALL treat the current slug as **active** if it is present in the list.

#### Scenario: Successful trade adds slug to active list

- **WHEN** the Pacifica trade execution sequence completes successfully for the current slug
- **THEN** the system adds that slug to the active pair positions list in browser storage

#### Scenario: Page load reflects stored active slug

- **WHEN** the user navigates to a signal detail URL whose slug is already in the active pair positions list
- **THEN** the UI treats that pair as active for gating the Open position control

## MODIFIED Requirements

### Requirement: Signal detail presents pair summary, chart, description, and CTA

The signal detail view SHALL display token A and token B with their respective allocations (token A **long**, token B **short** when aligned with the matched API row per the enrichment requirement), a candlestick chart for **weighted two-leg price ratio** context backed by **Pacifica REST kline history and Pacifica WebSocket candle updates** (see `pacifica-weighted-candles` capability), a textual **description**, and a primary control labeled for opening a position. When a **Solana wallet is connected** and the **Open position** control is **enabled**, activating the control SHALL initiate the **Pacifica trade execution** flow (see `pacifica-trade-execution`) for the current route **slug**, user **position size**, and selected **leverage**. When no wallet is connected, the system SHALL **not** submit trades; the control MAY be disabled or MAY prompt wallet connection per existing UX patterns. The **Open position** control SHALL be **disabled** when the **current slug** is listed as an **active pair position** in browser storage, when **market metadata** required for order sizing is **unavailable** for **either** symbol, or while a trade execution sequence is **in progress**. After a **successful** trade execution sequence, the system SHALL record the slug in browser storage per the **Signal detail tracks active pair positions in browser storage** requirement. The chart SHALL use default candle **`1h`** interval. The layout SHALL remain usable on narrow viewports (no required horizontal scrolling for the main card content). The view SHALL present distinguishable states when market data is loading, unavailable, or failed (e.g. message or skeleton), without implying that placeholder data is live. The view SHALL display an **Updated** datetime label (not **Generated**) when an API-matched row provides **`datetime_signal_occurred`**. The system SHALL **not** display an **entry price** section or value on the detail page. For the **initial** render with a non-empty series, the chart time scale SHALL emphasize **recent** candles (e.g. visible range focused on the trailing portion of the series so the latest bars are not confined to the extreme right edge of the viewport as with a full-history **fit-only** default). The **vertical** order of the main card content after the chart SHALL be: **description** first; then, when applicable, the **Pacifica account summary** (wallet connected) per the **Signal detail shows Pacifica account summary when wallet is connected** requirement; then **position size** and **leverage** controls per the **Signal detail provides leverage selection** requirement; then the **Open position** (or equivalent) **CTA**. The view SHALL present distinguishable states for **trade execution** loading and **failure** (e.g. inline message or non-blocking alert) without implying success when the API rejected the action.

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

#### Scenario: Open position runs trade flow when wallet connected and control enabled

- **WHEN** the user has connected a wallet, market metadata is available for both symbols, no active stored position exists for this slug, and the user activates **Open position**
- **THEN** the system runs the **Pacifica trade execution** flow for this slug with the current size and leverage

#### Scenario: Open position disabled for duplicate active pair

- **WHEN** browser storage already contains an active entry for the **same** slug as the current route
- **THEN** the **Open position** control is disabled or otherwise blocked from submitting a new trade for that pair

#### Scenario: Trade failure shows error and does not claim success

- **WHEN** the trade execution flow fails at leverage update or order submission
- **THEN** the user sees an explicit error state and the slug is not added to the active pair positions list
