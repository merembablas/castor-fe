## MODIFIED Requirements

### Requirement: Each position row shows pair, allocations, times, size, and unrealized P&L

For each position row the system SHALL display:

- Token A as the **long** leg and token B as the **short** leg, each with its **allocation percentage** (from pair/slug metadata).
- A **generated** datetime and an **opened** datetime when available: **opened** SHALL reflect the active-pair **openedAt** from storage (or equivalent user-visible open time); **generated** SHALL reflect signal or pair **generated** time when available from existing data sources, or MAY be omitted with a clear layout if unavailable.
- **Unrealized profit or loss** expressed as **percent** and as **US dollar** amount, both easy to scan, updated per the mark price candle requirement.
- **Immediately below** that unrealized P&L line, **net funding paid** for the pair: the **sum** of the Pacifica **Get positions** **`funding`** values for the **long** leg’s symbol and the **short** leg’s symbol (same REST field documented as funding paid by each position since open). The system SHALL format this as a **single** user-visible line with a clear label (e.g. net funding paid), using **smaller** typography than the unrealized P&L line. Values SHALL be readable without relying on color alone (e.g. signed currency or explicit sign).
- The **notional size** of the position in USD derived from Pacifica position data (or a clearly documented mapping), shown as a currency amount (e.g. a leading `$` and numeric value).

#### Scenario: Row includes all required fields

- **WHEN** a position row is rendered with full data
- **THEN** the user sees long token A and short token B with their allocation percentages, opened time, unrealized P&L in percent and dollars, **net funding paid derived from both legs’ `funding` below that P&L line in smaller type**, and opening size in dollars, and generated time when available

#### Scenario: Net funding uses smaller type than unrealized P&L

- **WHEN** the user views a position row that shows unrealized P&L and net funding paid
- **THEN** the net funding paid line uses a **smaller** font size than the unrealized P&L line

#### Scenario: Net funding aggregates both legs

- **WHEN** Pacifica Get positions returns a `funding` string for each leg of the displayed pair
- **THEN** the row’s net funding paid reflects the **numeric sum** of those two leg values (after parsing decimal strings), shown on the single net funding line
