## REMOVED Requirements

### Requirement: Positions page lists open positions with dummy data

The system SHALL render a dedicated page at `/positions` that displays a vertical list of open positions. For this release the list SHALL contain exactly three items sourced from static or in-memory dummy data. The page SHALL be reachable from the existing **Positions** navigation entry in the app header.

#### Scenario: User opens Positions from navigation

- **WHEN** the user activates the **Positions** link in the main navigation
- **THEN** the browser navigates to `/positions` and the positions list page is shown

#### Scenario: Three dummy rows are visible

- **WHEN** the user views `/positions`
- **THEN** exactly three position rows are displayed

**Reason**: Positions must reflect real Pacifica holdings and stored active pair slugs, not static fixtures.

**Migration**: Remove use of `DUMMY_POSITIONS` on `/positions`; implement cache + REST + WebSocket flow per the replacement requirement.

## ADDED Requirements

### Requirement: Positions page lists open pair positions backed by storage and Pacifica

The system SHALL render `/positions` as a list of **open pair positions** derived from **active pair positions** in browser storage (`castor:activePairPositions`). A slug SHALL appear as a row **only if** Pacifica **Get positions** reports **open positions for both** underlying symbols of that pair (resolved from the same slug metadata used elsewhere for pair trading). The page SHALL remain reachable from the **Positions** navigation entry. If storage is empty or no slug satisfies the API check, the system SHALL show an **empty** state (no fabricated rows). If the user cannot authenticate to Pacifica (e.g. wallet or agent key not available per existing app rules), the system SHALL show an explicit **unauthenticated** or **unavailable** state rather than dummy data.

#### Scenario: User opens Positions from navigation

- **WHEN** the user activates the **Positions** link in the main navigation
- **THEN** the browser navigates to `/positions` and the positions list or an explicit empty or unavailable state is shown

#### Scenario: No rows when storage is empty

- **WHEN** active pair storage contains no slugs
- **THEN** the page shows no position rows and does not show dummy placeholders

#### Scenario: Row appears only when both legs exist on Pacifica

- **WHEN** a slug is present in active pair storage and Pacifica positions include open positions for both symbols of that pair
- **THEN** exactly one row is shown for that slug with data sourced from the API and metadata

#### Scenario: Orphan API positions are hidden

- **WHEN** Pacifica reports an open position for a symbol that is not part of any slug currently in active pair storage
- **THEN** the positions page does not show a row for that orphan symbol

### Requirement: Positions page reconciles active pair storage with Pacifica positions

When Pacifica **Get positions** does not report an open position for **either** leg symbol of a stored slug (per product interpretation implemented consistently in code), the system SHALL **remove** that slug from active pair storage so future visits and other views (e.g. signal detail) stay consistent. The UI SHALL remove the corresponding row after reconciliation.

#### Scenario: Stale slug is pruned when legs are closed

- **WHEN** a slug remains in storage but Pacifica shows no open position for at least one required leg of that pair
- **THEN** the slug is removed from storage and the row is not displayed

### Requirement: Unrealized P&L updates from Pacifica mark price candles

For each displayed row, unrealized profit and loss SHALL be computed from **entry price** and **position size** from Pacifica positions plus a **live mark price** per symbol. The system SHALL subscribe to Pacifica WebSocket **mark price candle** for every symbol that backs a currently displayed row and SHALL **recompute** row P&L **whenever** a subscribed candle update is received for any of those symbols. Until the first mark is available for a symbol, the system SHALL show a **loading** or **pending** P&L state rather than a misleading static value.

#### Scenario: P&L changes after candle update

- **WHEN** a new mark price candle message arrives for a symbol in an open row
- **THEN** the row’s unrealized P&L values update to reflect the new mark

## MODIFIED Requirements

### Requirement: Each position row shows pair, allocations, times, size, and unrealized P&L

For each position row the system SHALL display:

- Token A as the **long** leg and token B as the **short** leg, each with its **allocation percentage** (from pair/slug metadata).
- A **generated** datetime and an **opened** datetime when available: **opened** SHALL reflect the active-pair **openedAt** from storage (or equivalent user-visible open time); **generated** SHALL reflect signal or pair **generated** time when available from existing data sources, or MAY be omitted with a clear layout if unavailable.
- **Unrealized profit or loss** expressed as **percent** and as **US dollar** amount, both easy to scan, updated per the mark price candle requirement.
- The **notional size** of the position in USD derived from Pacifica position data (or a clearly documented mapping), shown as a currency amount (e.g. a leading `$` and numeric value).

#### Scenario: Row includes all required fields

- **WHEN** a position row is rendered with full data
- **THEN** the user sees long token A and short token B with their allocation percentages, opened time, unrealized P&L in percent and dollars, and opening size in dollars, and generated time when available

### Requirement: Unrealized P&L uses green for profit and red for loss

The system SHALL style unrealized profit (positive P&L) with a **green** foreground treatment and unrealized loss (negative P&L) with a **red** foreground treatment. P&L text SHALL not rely on color alone (e.g. signed values or explicit profit/loss indicators SHALL accompany color).

#### Scenario: Profitable position shows green styling

- **WHEN** a position has positive unrealized P&L
- **THEN** its P&L percent and dollar display use green styling and a non-color-only cue (such as a leading plus sign or explicit positive formatting)

#### Scenario: Losing position shows red styling

- **WHEN** a position has negative unrealized P&L
- **THEN** its P&L percent and dollar display use red styling and a non-color-only cue (such as a leading minus sign or explicit negative formatting)

### Requirement: Close position control appears on the right side of each row

Each position row SHALL include a **Close position** control. On viewports where horizontal space allows, the control SHALL appear on the **right side** of the row relative to the primary content (pair, times, P&L, size). The control SHALL remain reachable and tappable on narrow viewports (layout MAY stack vertically).

#### Scenario: Close control is present per row

- **WHEN** the user views `/positions` and at least one position row is displayed
- **THEN** each displayed row includes a **Close position** control

#### Scenario: Desktop layout places Close on the right

- **WHEN** the user views a position row on a typical desktop-width viewport
- **THEN** the **Close position** control is aligned to the right of the row’s main content block
