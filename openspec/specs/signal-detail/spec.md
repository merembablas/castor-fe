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

### Requirement: Signal detail tracks active pair positions in browser storage

The system SHALL maintain a **persistent list** of **active pair positions** in **browser storage** using an application-defined storage key. Each stored entry SHALL include at minimum the **route slug** string identifying the pair signal (e.g. `SOL:20-ETH:80`) and MAY include a timestamp of when the position was opened. The system SHALL read this list when rendering the signal detail view for a slug and SHALL treat the current slug as **active** if it is present in the list.

#### Scenario: Successful trade adds slug to active list

- **WHEN** the Pacifica trade execution sequence completes successfully for the current slug
- **THEN** the system adds that slug to the active pair positions list in browser storage

#### Scenario: Page load reflects stored active slug

- **WHEN** the user navigates to a signal detail URL whose slug is already in the active pair positions list
- **THEN** the UI treats that pair as active for gating the Open position control

### Requirement: Signal detail shows Pacifica account summary when wallet is connected

When a **Solana wallet is connected** and a **wallet public address** is available, the signal detail view SHALL request **Pacifica account info** (documented under **Get Account Info**) for that address and SHALL display **available balance to spend** (using the field or derivation specified by the API and product copy) and **margin usage** as **total margin used relative to account equity**, expressed as a **percentage** such that **100%** means margin used equals equity (maximum stress before liquidation in the user’s framing). This block SHALL appear **below** the textual **description** and **above** the **total amount** and **leverage** controls. When the wallet is **not** connected, the system SHALL **not** show this block as live account data. When the request is **in flight**, **fails**, or returns no usable data, the system SHALL show an explicit **loading**, **error**, or **unavailable** state without inventing balances.

#### Scenario: Connected wallet shows balance and margin percent

- **WHEN** the user has connected a wallet and Pacifica account info returns valid **account equity** and **total margin used** (or equivalent mapped fields)
- **THEN** the signal detail page shows **available to spend** and a **margin used** percentage derived from **total margin used** and **account equity**, placed between the **description** and **total amount** controls

#### Scenario: Wallet disconnected hides account summary

- **WHEN** no wallet address is available
- **THEN** the Pacifica account summary block is not shown as authenticated account data

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

### Requirement: Signal detail omits exchange lot and min-order base units in the open-position section

The system SHALL NOT display per-symbol **lot size** or **minimum order size** in **base units** in the signal detail **open-position** region. Exchange metadata MAY still be used internally for order sizing and execution.

#### Scenario: No lot or base min-order strings in open-position copy

- **WHEN** the user views the open-position section and market metadata for both symbols is loaded
- **THEN** the UI does not show user-visible lines that list lot sizes or minimum order sizes in base units for each symbol

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

### Requirement: Visual design aligns with project design system

The signal detail page and its card SHALL follow the rules in `.cursor/rules/design-system-ui-ux.mdc`: oceanic teal/blue palette; card corners at 24px radius (or Tailwind equivalent); pill controls at full radius; primary CTA solid `#22C1EE` with white foreground; primary text `#144955` and secondary `#527E88`; soft teal-tinted shadow/glow instead of heavy black shadows; glassmorphism for floating UI where appropriate (`backdrop-filter` blur ~12px with semi-transparent light background); chart coloring using soft gradients between `#22C1EE` and `#144955`; interactive elements SHALL have a hover state that subtly increases brightness or scale to approximately 1.02.

#### Scenario: Primary button matches design system

- **WHEN** the user views the Open position control
- **THEN** it uses pill shape, primary fill `#22C1EE`, white label, and a visible hover affordance consistent with the design system

#### Scenario: Card and typography match design system

- **WHEN** the user views the signal detail card
- **THEN** the card uses the prescribed radius and shadow treatment, and headings/body use the specified high-contrast and secondary text colors
