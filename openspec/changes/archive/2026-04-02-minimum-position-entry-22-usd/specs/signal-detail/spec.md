## ADDED Requirements

### Requirement: Signal detail omits exchange lot and min-order base units in the open-position section

The system SHALL NOT display per-symbol **lot size** or **minimum order size** in **base units** in the signal detail **open-position** region. Exchange metadata MAY still be used internally for order sizing and execution.

#### Scenario: No lot or base min-order strings in open-position copy

- **WHEN** the user views the open-position section and market metadata for both symbols is loaded
- **THEN** the UI does not show user-visible lines that list lot sizes or minimum order sizes in base units for each symbol

## MODIFIED Requirements

### Requirement: Signal detail provides a single USD collateral input for opening a position

The signal detail view SHALL provide **one** control for entering **total position size in USD** (total notional for the pair—the same economic basis used for leg split in `pacifica-trade-execution`). The system SHALL **not** offer fixed dollar **preset chips** (e.g. $10 / $20 / $30) or a separate **Custom** mode. The product SHALL enforce a **minimum entry** of **$22** USD on this **total amount** field. While market metadata, reference prices, and leverage are available, the control SHALL be **initialized or updated** to at least the **effective minimum total notional**, defined as the greater of **$22** and the **minimum total notional** implied by the **minimum margin** required for both legs per exchange min order and lot rules and the signal’s allocation split (consistent with `minCollateralUsdForPair` multiplied by selected leverage), unless the user has **explicitly edited** the value after load, in which case the system SHALL **not** replace their entry automatically when leverage or prices change. The system SHALL reject or block submit when **total amount** is **below** the **effective minimum total notional** (equivalently, when derived margin is below the corresponding minimum margin). User-facing copy in the open-position section SHALL state that **minimum entry** is **$22** in USD (total amount), without requiring users to interpret base-unit exchange fields. The control SHALL appear **alongside** the leverage control **above** the **Open position** action per the existing content order requirement. User-facing copy SHALL describe this field as **total amount** (or equivalent) and SHALL use **margin** (not **collateral**) for the derived capital-at-leverage figure, consistent with Pacifica terminology.

#### Scenario: No preset size chips

- **WHEN** the user views the open-position section on signal detail
- **THEN** the system does not show $10, $20, $30, or Custom preset buttons for sizing

#### Scenario: Default at least effective minimum total when user has not customized

- **WHEN** market metadata for both symbols is available, mark prices are available, leverage is set, and the user has not chosen to keep a distinct total amount after initial presentation
- **THEN** the total amount field shows a value that is **not less than** the **effective minimum total notional** (at least **$22** and at least the exchange-implied minimum total when that value is computable)

#### Scenario: Submit blocked below product minimum

- **WHEN** the user enters a total amount **less than $22**
- **THEN** the **Open position** control is disabled or equivalent and the user sees guidance that references the **$22** minimum entry

#### Scenario: Submit blocked below exchange-implied minimum when it exceeds $22

- **WHEN** the exchange-implied minimum total notional is **greater than $22** and the user enters a total amount **below** that exchange-implied minimum
- **THEN** the **Open position** control is disabled or equivalent and the user sees **USD-only** guidance to increase total amount (or apply a suggested total), **without** displaying lot size or min order in base units
