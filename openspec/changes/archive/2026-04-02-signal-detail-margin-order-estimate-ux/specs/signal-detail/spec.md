## MODIFIED Requirements

### Requirement: Signal detail presents pair summary, chart, description, and CTA

The signal detail view SHALL display token A and token B with their respective allocations (token A **long**, token B **short** when aligned with the matched API row per the enrichment requirement), a candlestick chart for **weighted two-leg price ratio** context backed by **Pacifica REST kline history and Pacifica WebSocket candle updates** (see `pacifica-weighted-candles` capability), a textual **description**, and a primary control labeled for opening a position. When a **Solana wallet is connected** and the **Open position** control is **enabled**, activating the control SHALL initiate the **Pacifica trade execution** flow (see `pacifica-trade-execution`) for the current route **slug**, user-entered **total position size in USD** (total notional for the pair), and selected **leverage**. When no wallet is connected, the system SHALL **not** submit trades; the control MAY be disabled or MAY prompt wallet connection per existing UX patterns. The **Open position** control SHALL be **disabled** when the **current slug** is listed as an **active pair position** in browser storage, when **market metadata** required for order sizing is **unavailable** for **either** symbol, or while a trade execution sequence is **in progress**. After a **successful** trade execution sequence, the system SHALL record the slug in browser storage per the **Signal detail tracks active pair positions in browser storage** requirement. The chart SHALL use default candle **`1h`** interval. The layout SHALL remain usable on narrow viewports (no required horizontal scrolling for the main card content). The view SHALL present distinguishable states when market data is loading, unavailable, or failed (e.g. message or skeleton), without implying that placeholder data is live. The view SHALL display an **Updated** datetime label (not **Generated**) when an API-matched row provides **`datetime_signal_occurred`**. The system SHALL **not** display an **entry price** section or value on the detail page. For the **initial** render with a non-empty series, the chart time scale SHALL emphasize **recent** candles (e.g. visible range focused on the trailing portion of the series so the latest bars are not confined to the extreme right edge of the viewport as with a full-history **fit-only** default). The **vertical** order of the main card content after the chart SHALL be: **description** first; then, when applicable, the **Pacifica account summary** (wallet connected) per the **Signal detail shows Pacifica account summary when wallet is connected** requirement; then **total amount (USD)** and **leverage** controls per the **Signal detail provides a single USD collateral input for opening a position** and **Signal detail provides leverage selection aligned with effective max and five-x steps** requirements; then a **per-order** estimate (margin and leg notionals) per the **Signal detail shows estimated collateral and total notional for the pending open** requirement; then the **Open position** (or equivalent) **CTA**. The view SHALL present distinguishable states for **trade execution** loading and **failure** (e.g. inline message or non-blocking alert) without implying success when the API rejected the action.

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
- **THEN** the **description** appears before any **wallet-specific account** summary, and **total amount** with **leverage** (and the per-order estimate when applicable) appear **above** the **Open position** control

#### Scenario: Open position runs trade flow when wallet connected and control enabled

- **WHEN** the user has connected a wallet, market metadata is available for both symbols, no active stored position exists for this slug, and the user activates **Open position**
- **THEN** the system runs the **Pacifica trade execution** flow for this slug with the current total amount and leverage

#### Scenario: Open position disabled for duplicate active pair

- **WHEN** browser storage already contains an active entry for the **same** slug as the current route
- **THEN** the **Open position** control is disabled or otherwise blocked from submitting a new trade for that pair

#### Scenario: Trade failure shows error and does not claim success

- **WHEN** the trade execution flow fails at leverage update or order submission
- **THEN** the user sees an explicit error state and the slug is not added to the active pair positions list

### Requirement: Signal detail shows Pacifica account summary when wallet is connected

When a **Solana wallet is connected** and a **wallet public address** is available, the signal detail view SHALL request **Pacifica account info** (documented under **Get Account Info**) for that address and SHALL display **available balance to spend** (using the field or derivation specified by the API and product copy) and **margin usage** as **total margin used relative to account equity**, expressed as a **percentage** such that **100%** means margin used equals equity (maximum stress before liquidation in the user’s framing). This block SHALL appear **below** the textual **description** and **above** the **total amount** and **leverage** controls. When the wallet is **not** connected, the system SHALL **not** show this block as live account data. When the request is **in flight**, **fails**, or returns no usable data, the system SHALL show an explicit **loading**, **error**, or **unavailable** state without inventing balances.

#### Scenario: Connected wallet shows balance and margin percent

- **WHEN** the user has connected a wallet and Pacifica account info returns valid **account equity** and **total margin used** (or equivalent mapped fields)
- **THEN** the signal detail page shows **available to spend** and a **margin used** percentage derived from **total margin used** and **account equity**, placed between the **description** and **total amount** controls

#### Scenario: Wallet disconnected hides account summary

- **WHEN** no wallet address is available
- **THEN** the Pacifica account summary block is not shown as authenticated account data

### Requirement: Signal detail provides a single USD collateral input for opening a position

The signal detail view SHALL provide **one** control for entering **total position size in USD** (total notional for the pair—the same economic basis used for leg split in `pacifica-trade-execution`). The system SHALL **not** offer fixed dollar **preset chips** (e.g. $10 / $20 / $30) or a separate **Custom** mode. While market metadata, reference prices, and leverage are available, the control SHALL be **initialized or updated** to at least the **minimum total notional** implied by the **minimum margin** required for both legs per exchange min order and lot rules and the signal’s allocation split (consistent with `minCollateralUsdForPair` multiplied by selected leverage), unless the user has **explicitly edited** the value after load, in which case the system SHALL **not** replace their entry automatically when leverage or prices change. The system SHALL reject or block submit when **derived margin** (total ÷ leverage) is below that minimum margin (equivalently, when total is below minimum total). The control SHALL appear **alongside** the leverage control **above** the **Open position** action per the existing content order requirement. User-facing copy SHALL describe this field as **total amount** (or equivalent) and SHALL use **margin** (not **collateral**) for the derived capital-at-leverage figure, consistent with Pacifica terminology.

#### Scenario: No preset size chips

- **WHEN** the user views the open-position section on signal detail
- **THEN** the system does not show $10, $20, $30, or Custom preset buttons for sizing

#### Scenario: Default at least minimum total when user has not customized

- **WHEN** market metadata for both symbols is available, mark prices are available, leverage is set, and the user has not chosen to keep a distinct total amount after initial presentation
- **THEN** the total amount field shows a value that is **not less than** the minimum total implied by `minCollateralUsdForPair` at that leverage and allocations

#### Scenario: Submit still blocked below exchange minimum

- **WHEN** the user enters a total amount such that derived margin is below the computed minimum margin for the pair at the selected leverage
- **THEN** the **Open position** control remains disabled or equivalent and the user sees guidance to increase total amount or margin (consistent with existing minimum-notional behavior)

### Requirement: Signal detail shows estimated collateral and total notional for the pending open

The signal detail view SHALL display a **This order (estimate)** (or equivalent) panel when a valid **total amount** and **leverage** are available. The panel SHALL show **margin** for this order in USD as **total amount ÷ selected leverage** (read-only informational text). The panel SHALL **not** repeat **total notional** as a separate line when it equals the total amount input. The panel SHALL show **estimated long leg notional** and **estimated short leg notional** in USD, split by slug **allocation A** on token A (long) and **allocation B** on token B (short), matching the same split rules as `pacifica-trade-execution`. All displayed estimate values SHALL **update immediately** when the user changes total amount or leverage (before submit). Copy SHALL distinguish this **per-order** margin from **account-level** margin usage in the Pacifica account summary block.

#### Scenario: Margin and leg sizes update with total amount

- **WHEN** the user changes the total amount and leverage is fixed
- **THEN** displayed margin updates to total ÷ leverage and long/short USD estimates update to the new split

#### Scenario: Margin and leg sizes update with leverage

- **WHEN** the user changes leverage with a fixed total amount
- **THEN** displayed margin updates and long/short USD totals remain consistent with the unchanged total notional

### Requirement: Signal detail provides leverage selection aligned with effective max and five-x steps

The signal detail view SHALL provide a **leverage** control **alongside** the **total amount** control for opening a position. The **maximum** selectable leverage SHALL be **effective maximum leverage** (per `pacifica-market-metadata`: the **minimum** of both symbols’ documented **max leverage**). The **minimum** selectable leverage SHALL be **1×**. The control SHALL be implemented as a **slider** (range input or equivalent) with **integer** steps from **1** through **effective max** inclusive. The **default** leverage when metadata becomes available SHALL be **effective max** unless a stricter product or compliance rule applies. While market metadata for **either** symbol is **loading** or **unavailable**, the control SHALL be **disabled** or show a **non-misleading** placeholder state.

#### Scenario: Slider maximum matches smaller of two symbol maxima

- **WHEN** symbol A allows max leverage 20 and symbol B allows max leverage 12
- **THEN** the leverage slider’s maximum is **12**

#### Scenario: Default is effective maximum

- **WHEN** effective maximum leverage is **20** and metadata has loaded
- **THEN** the initial leverage value is **20×** (until the user moves the slider)

#### Scenario: Integer steps across full range

- **WHEN** effective maximum leverage is **7**
- **THEN** the user can select any integer leverage from **1** through **7**

#### Scenario: Unavailable metadata

- **WHEN** market metadata for either symbol is loading or failed
- **THEN** the leverage control does not imply a false leverage value
