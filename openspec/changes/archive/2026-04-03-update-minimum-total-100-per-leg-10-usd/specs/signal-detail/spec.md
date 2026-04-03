## MODIFIED Requirements

### Requirement: Signal detail presents pair summary, chart, description, and CTA

The signal detail view SHALL display token A and token B with their respective allocations (token A **long**, token B **short** when aligned with the matched API row per the enrichment requirement), a candlestick chart for **weighted two-leg price ratio** context backed by **Pacifica REST kline history and Pacifica WebSocket candle updates** (see `pacifica-weighted-candles` capability), a textual **description**, and a primary control labeled for opening a position. When a **Solana wallet is connected** and the **Open position** control is **enabled**, activating the control SHALL initiate the **Pacifica trade execution** flow (see `pacifica-trade-execution`) for the current route **slug**, user-entered **total position size in USD** (total notional for the pair), and selected **leverage**. When no wallet is connected, the system SHALL **not** submit trades; the control MAY be disabled or MAY prompt wallet connection per existing UX patterns. The **Open position** control SHALL be **disabled** when the **current slug** is listed as an **active pair position** in browser storage, when **market metadata** required for order sizing is **unavailable** for **either** symbol, while a trade execution sequence is **in progress**, when **total amount** is below **$100** USD (product minimum total notional), or when **either** the **estimated long** leg notional or **estimated short** leg notional (from total amount and slug allocation percentages) is below **$10** USD (product minimum per leg). After a **successful** trade execution sequence, the system SHALL record the slug in browser storage per the **Signal detail tracks active pair positions in browser storage** requirement. The chart SHALL use default candle **`1h`** interval. The layout SHALL remain usable on narrow viewports (no required horizontal scrolling for the main card content). The view SHALL present distinguishable states when market data is loading, unavailable, or failed (e.g. message or skeleton), without implying that placeholder data is live. The view SHALL display an **Updated** datetime label (not **Generated**) when an API-matched row provides **`datetime_signal_occurred`**. The system SHALL **not** display an **entry price** section or value on the detail page. For the **initial** render with a non-empty series, the chart time scale SHALL emphasize **recent** candles (e.g. visible range focused on the trailing portion of the series so the latest bars are not confined to the extreme right edge of the viewport as with a full-history **fit-only** default). The **vertical** order of the main card content after the chart SHALL be: **description** first; then, when applicable, the **Pacifica account summary** (wallet connected) per the **Signal detail shows Pacifica account summary when wallet is connected** requirement; then **total amount (USD)** and **leverage** controls per the **Signal detail provides a single USD collateral input for opening a position** and **Signal detail provides leverage selection aligned with effective max and five-x steps** requirements; then a **per-order** estimate (margin and leg notionals) per the **Signal detail shows estimated collateral and total notional for the pending open** requirement; then the **Open position** (or equivalent) **CTA**. The view SHALL present distinguishable states for **trade execution** loading and **failure** (e.g. inline message or non-blocking alert) without implying success when the API rejected the action.

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

#### Scenario: Open position disabled when a leg is below product minimum

- **WHEN** total amount is **$100** or more but the **estimated long** or **estimated short** leg notional is **below $10** (e.g. highly skewed allocations)
- **THEN** the **Open position** control is disabled or equivalent and the user sees guidance referencing the **$10** minimum per leg (and increasing total amount)

#### Scenario: Trade failure shows error and does not claim success

- **WHEN** the trade execution flow fails at leverage update or order submission
- **THEN** the user sees an explicit error state and the slug is not added to the active pair positions list

### Requirement: Signal detail provides a single USD collateral input for opening a position

The signal detail view SHALL provide **one** control for entering **total position size in USD** (total notional for the pair—the same economic basis used for leg split in `pacifica-trade-execution`). The system SHALL **not** offer fixed dollar **preset chips** (e.g. $10 / $20 / $30) or a separate **Custom** mode. The product SHALL enforce a **minimum total** of **$100** USD on this **total amount** field and SHALL require **each** of the **estimated long** and **estimated short** leg notionals (total × allocation A ÷ 100 and total × allocation B ÷ 100) to be **at least $10** USD before the **Open position** control is enabled. While **market metadata for both symbols** is available and the user has **not** explicitly edited the total amount after load, the control SHALL be **initialized or updated** to a value **not less than** the greater of **$100** and the **minimum total notional** that satisfies **both** leg estimates ≥ **$10** for the current slug allocations; after the user edits the field, the system SHALL **not** replace their entry automatically when leverage or prices change. The system SHALL reject or block submit when **total amount** is **below $100** or when **either** leg estimate is **below $10**. User-facing copy in the open-position section SHALL state that **minimum entry** is **$100** in USD (total amount) and that **each** leg needs **at least $10** notional. The **Open position** control SHALL **not** be enabled when product minimums are not met; the venue may still reject orders that violate lot or min-order rules after sizing. The control SHALL appear **alongside** the leverage control **above** the **Open position** action per the existing content order requirement. User-facing copy SHALL describe this field as **total amount** (or equivalent) and SHALL use **margin** (not **collateral**) for the derived capital-at-leverage figure, consistent with Pacifica terminology.

#### Scenario: No preset size chips

- **WHEN** the user views the open-position section on signal detail
- **THEN** the system does not show $10, $20, $30, or Custom preset buttons for sizing

#### Scenario: Default total satisfies product floors when user has not customized

- **WHEN** market metadata for both symbols is available and the user has not chosen to keep a distinct total amount after initial presentation
- **THEN** the total amount field shows a value **at least $100** and **large enough** that **both** estimated long and short leg notionals are **at least $10**

#### Scenario: Submit blocked below product total minimum

- **WHEN** the user enters a total amount **less than $100**
- **THEN** the **Open position** control is disabled or equivalent and the user sees guidance that references the **$100** minimum total entry

#### Scenario: Submit blocked below product per-leg minimum

- **WHEN** the user enters a total amount **at least $100** but **either** estimated leg notional is **still below $10**
- **THEN** the **Open position** control is disabled or equivalent and the user sees guidance that references the **$10** minimum per leg
