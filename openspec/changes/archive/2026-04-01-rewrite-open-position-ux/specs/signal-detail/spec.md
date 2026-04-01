## ADDED Requirements

### Requirement: Signal detail provides a single USD collateral input for opening a position

The signal detail view SHALL provide **one** control for entering **USD collateral** (the same quantity used as **position size** in `pacifica-trade-execution`: collateral multiplied by selected leverage yields total notional). The system SHALL **not** offer fixed dollar **preset chips** (e.g. $10 / $20 / $30) or a separate **Custom** mode. While market metadata, reference prices, and leverage are available, the control SHALL be **initialized or updated** to at least the **minimum collateral** required for both legs per exchange min order and lot rules and the signal’s allocation split (consistent with `minCollateralUsdForPair`), unless the user has **explicitly edited** the collateral value after load, in which case the system SHALL **not** replace their entry automatically when leverage or prices change. The control SHALL reject or block submit when collateral is below that minimum (existing validation behavior). The collateral control SHALL appear **alongside** the leverage control **above** the **Open position** action per the existing content order requirement.

#### Scenario: No preset size chips

- **WHEN** the user views the open-position section on signal detail
- **THEN** the system does not show $10, $20, $30, or Custom preset buttons for sizing

#### Scenario: Default at least minimum collateral when user has not customized

- **WHEN** market metadata for both symbols is available, mark prices are available, leverage is set, and the user has not chosen to keep a distinct collateral value after initial presentation
- **THEN** the collateral field shows a value that is **not less than** the computed minimum collateral for the pair at that leverage and allocations

#### Scenario: Submit still blocked below exchange minimum

- **WHEN** the user enters collateral below the computed minimum for the pair at the selected leverage
- **THEN** the **Open position** control remains disabled or equivalent and the user sees guidance to increase collateral (consistent with existing minimum-notional behavior)

### Requirement: Signal detail shows estimated collateral and total notional for the pending open

The signal detail view SHALL display **estimated collateral (margin) for this order** in USD: the **same** numeric basis as the validated collateral input used for trade execution. The view SHALL also display **total notional** for the pending open as **collateral × selected leverage** (USD), consistent with `pacifica-trade-execution`. Both displayed values SHALL **update immediately** when the user changes collateral or leverage (before submit). Copy SHALL distinguish this **per-order** estimate from **account-level** margin usage shown in the Pacifica account summary block.

#### Scenario: Values update with collateral input

- **WHEN** the user changes the collateral amount
- **THEN** the displayed collateral for this order matches the interpreted input and total notional updates to collateral times leverage

#### Scenario: Values update with leverage

- **WHEN** the user changes leverage with a fixed collateral amount
- **THEN** total notional updates and collateral for this order remains tied to the collateral input

## MODIFIED Requirements

### Requirement: Signal detail provides leverage selection aligned with effective max and five-x steps

The signal detail view SHALL provide a **leverage** control **alongside** the **collateral** control for opening a position. The **maximum** selectable leverage SHALL be **effective maximum leverage** (per `pacifica-market-metadata`: the **minimum** of both symbols’ documented **max leverage**). The **minimum** selectable leverage SHALL be **1×**. The control SHALL be implemented as a **slider** (range input or equivalent) with **integer** steps from **1** through **effective max** inclusive. The **default** leverage when metadata becomes available SHALL be **effective max** unless a stricter product or compliance rule applies. While market metadata for **either** symbol is **loading** or **unavailable**, the control SHALL be **disabled** or show a **non-misleading** placeholder state.

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
