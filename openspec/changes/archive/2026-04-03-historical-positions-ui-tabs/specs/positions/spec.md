## ADDED Requirements

### Requirement: Positions page provides Active and Historical tabs on the same route

The system SHALL present `/positions` with a **tabbed** (or equivalent segmented) control offering **Active** and **Historical**. The **Active** tab SHALL show open pair positions per existing merge and Pacifica rules. The **Historical** tab SHALL show **closed** pair position records read from the client **historical pair positions** web-cache store (`castor:historicalPairPositions` and schema defined in the **historical-positions** capability), without requiring Pacifica **Get positions** for row presence. Tab labels SHALL be clear (e.g. **Active** / **Historical**). When the wallet is not connected or positions are unavailable per existing rules, the system MAY hide tabs and show the same **unauthenticated** or **unavailable** messaging as today.

#### Scenario: User switches to Historical tab

- **WHEN** the user is on `/positions` with tabs visible and selects **Historical**
- **THEN** the page shows a list of historical closed pair records from the historical web-cache store (or an empty state if there are none), and does not show the Active-only **Close position** control for those rows

#### Scenario: Historical tab empty state

- **WHEN** the historical store contains no valid records
- **THEN** the Historical tab shows an explicit empty state (no fabricated rows)

### Requirement: Historical position rows match active card vocabulary with closed-time and realized P&L

For each record shown on the **Historical** tab, the system SHALL render a **card** or row that matches the **active** positions card vocabulary (long/short legs, allocation percentages, oceanic palette, 24px radius, soft teal glow, hover affordance on the card surface) as specified in the positions design-system requirement. Each historical row SHALL display:

- Token A as **long** and token B as **short** with **allocation percentages** from the historical record (or equivalent metadata resolution consistent with that record).
- An **opened** datetime derived from the record’s **`openedAt`**.
- A **closed** datetime derived from the record’s **`closedAt`**, user-visible and distinct from **opened**.
- **Realized profit or loss** at close as a **US dollar** amount from the record’s **`realizedPnlUsd`**, easy to scan, with the same **green** / **red** / neutral foreground treatment as unrealized P&L on active rows for positive / negative / zero, and SHALL NOT rely on color alone (signed value or equivalent).
- The system SHALL **not** show a **Close position** control on historical rows.
- The system SHALL **not** show a **pending** or live-updating P&L state for historical rows.

The system SHALL **not** duplicate **net funding paid** in the primary content column on historical rows if funding is shown in the right-hand column per the following requirement.

#### Scenario: Historical row shows long/short, times, and realized P&L

- **WHEN** a historical record is rendered with full fields
- **THEN** the user sees long and short legs with allocations, opened and closed datetimes, realized P&L in US dollars with appropriate green/red/neutral styling and non-color-only cues, and no Close position control

### Requirement: Historical rows place funding paid and closed time in the former Close column

On historical rows, the system SHALL use the **right-hand** column area (the same layout region where **Active** rows place **Close position**) to present:

- **Funding paid** as a **single** line labeled clearly (e.g. **Funding paid**), using the record’s **`fundingPaidUsd`** (net across both legs as stored), formatted as signed currency, readable without relying on color alone.
- **Closed** datetime in this column (the primary column MAY also show **closed** for scanability; if shown in both places, use consistent formatting).

**Funding paid** styling SHALL use a **green** foreground for **positive** values and a **red** foreground for **negative** values, with the same accessibility expectation as P&L (explicit sign or label in addition to color).

#### Scenario: Funding positive is green and negative is red

- **WHEN** a historical record has **`fundingPaidUsd`** greater than zero
- **THEN** the funding paid amount uses green foreground treatment and a non-color-only cue

#### Scenario: Funding negative is red

- **WHEN** a historical record has **`fundingPaidUsd`** less than zero
- **THEN** the funding paid amount uses red foreground treatment and a non-color-only cue

## MODIFIED Requirements

### Requirement: Positions page lists open pair positions backed by storage and Pacifica

The system SHALL render `/positions` with an **Active** view that lists **open pair positions** derived from **active pair positions** in browser storage (`castor:activePairPositions`). A slug SHALL appear as a row in the Active view **only if** Pacifica **Get positions** reports **open positions for both** underlying symbols of that pair (resolved from the same slug metadata used elsewhere for pair trading). The page SHALL also provide a **Historical** view on the same route that lists closed records from the historical web-cache store per the **Positions page provides Active and Historical tabs** requirement. The page SHALL remain reachable from the **Positions** navigation entry. If active pair storage is empty or no slug satisfies the API check, the **Active** view SHALL show an **empty** state (no fabricated rows). If the user cannot authenticate to Pacifica (e.g. wallet or agent key not available per existing app rules), the system SHALL show an explicit **unauthenticated** or **unavailable** state rather than dummy data for flows that require Pacifica.

#### Scenario: User opens Positions from navigation

- **WHEN** the user activates the **Positions** link in the main navigation
- **THEN** the browser navigates to `/positions` and the Active list, Historical list (via tabs), or an explicit empty or unavailable state is shown per the rules above

#### Scenario: No rows when storage is empty

- **WHEN** active pair storage contains no slugs
- **THEN** the Active view shows no position rows and does not show dummy placeholders

#### Scenario: Row appears only when both legs exist on Pacifica

- **WHEN** a slug is present in active pair storage and Pacifica positions include open positions for both symbols of that pair
- **THEN** exactly one row is shown for that slug in the Active view with data sourced from the API and metadata

#### Scenario: Orphan API positions are hidden

- **WHEN** Pacifica reports an open position for a symbol that is not part of any slug currently in active pair storage
- **THEN** the Active view does not show a row for that orphan symbol

### Requirement: Unrealized P&L updates from Pacifica mark price candles

For each row displayed in the **Active** view, unrealized profit and loss SHALL be computed from **entry price** and **position size** from Pacifica positions plus a **live mark price** per symbol. The system SHALL subscribe to Pacifica WebSocket **mark price candle** for every symbol that backs a currently displayed **Active** row and SHALL **recompute** row P&L **whenever** a subscribed candle update is received for any of those symbols. Until the first mark is available for a symbol, the system SHALL show a **loading** or **pending** P&L state rather than a misleading static value. The system SHALL **not** require mark price subscriptions for **Historical** tab rows.

#### Scenario: P&L changes after candle update

- **WHEN** a new mark price candle message arrives for a symbol in an open row on the Active view
- **THEN** the row’s unrealized P&L values update to reflect the new mark

### Requirement: Each position row shows pair, allocations, times, size, and unrealized P&L

For each **Active** position row the system SHALL display:

- Token A as the **long** leg and token B as the **short** leg, each with its **allocation percentage** (from pair/slug metadata).
- A **generated** datetime and an **opened** datetime when available: **opened** SHALL reflect the active-pair **openedAt** from storage (or equivalent user-visible open time); **generated** SHALL reflect signal or pair **generated** time when available from existing data sources, or MAY be omitted with a clear layout if unavailable.
- **Unrealized profit or loss** expressed as **percent** and as **US dollar** amount, both easy to scan, updated per the mark price candle requirement.
- **Immediately below** that unrealized P&L line, **net funding paid** for the pair: the **sum** of the Pacifica **Get positions** **`funding`** values for the **long** leg’s symbol and the **short** leg’s symbol (same REST field documented as funding paid by each position since open). The system SHALL format this as a **single** user-visible line with a clear label (e.g. net funding paid), using **smaller** typography than the unrealized P&L line. Values SHALL be readable without relying on color alone (e.g. signed currency or explicit sign).
- The **notional size** of the position in USD derived from Pacifica position data (or a clearly documented mapping), shown as a currency amount (e.g. a leading `$` and numeric value).

#### Scenario: Row includes all required fields

- **WHEN** an Active position row is rendered with full data
- **THEN** the user sees long token A and short token B with their allocation percentages, opened time, unrealized P&L in percent and dollars, **net funding paid derived from both legs’ `funding` below that P&L line in smaller type**, and opening size in dollars, and generated time when available

#### Scenario: Net funding uses smaller type than unrealized P&L

- **WHEN** the user views an Active position row that shows unrealized P&L and net funding paid
- **THEN** the net funding paid line uses a **smaller** font size than the unrealized P&L line

#### Scenario: Net funding aggregates both legs

- **WHEN** Pacifica Get positions returns a `funding` string for each leg of the displayed pair
- **THEN** the row’s net funding paid reflects the **numeric sum** of those two leg values (after parsing decimal strings), shown on the single net funding line

### Requirement: Close position control appears on the right side of each row

Each **Active** position row SHALL include a **Close position** control. On viewports where horizontal space allows, the control SHALL appear on the **right side** of the row relative to the primary content (pair, times, P&L, size). The control SHALL remain reachable and tappable on narrow viewports (layout MAY stack vertically). **Historical** rows SHALL **not** include this control.

#### Scenario: Close control is present per row

- **WHEN** the user views `/positions` on the **Active** tab and at least one position row is displayed
- **THEN** each displayed **Active** row includes a **Close position** control

#### Scenario: Desktop layout places Close on the right

- **WHEN** the user views an Active position row on a typical desktop-width viewport
- **THEN** the **Close position** control is aligned to the right of the row’s main content block

### Requirement: Positions list UI conforms to design-system-ui-ux

The `/positions` page—the **tab** control (if interactive), **position list** rows or cards for both **Active** and **Historical**, **typography**, and **buttons** (including **Close position** on Active rows)—SHALL conform to `.cursor/rules/design-system-ui-ux.mdc`. Normatively:

- **Theme**: The UI SHALL use a serene, trustworthy **oceanic** palette; long/short accents SHALL remain within that palette with readable contrast.
- **Radius**: **Card-like** list surfaces SHALL use **24px** corner radius (or Tailwind/CSS equivalent). **Pill-shaped** controls (e.g. long/short chips, **Close position** button, tab triggers) SHALL use **full pill** radius (`border-radius: 9999px` or equivalent) where the design system applies pills.
- **Shadows**: List cards SHALL use a **soft teal-tinted glow** (e.g. `0 10px 30px -10px rgba(34, 193, 238, 0.2)`) and SHALL NOT rely on heavy black shadows.
- **Typography**: **High-contrast** text SHALL use **`#144955`**; **secondary** meta text SHALL use **`#527E88`**; sans-serif and semi-bold headings as specified in the design system.
- **Buttons**: **Close position** SHALL use **secondary** styling: ghost with **`#22C1EE`** border and/or semi-transparent **`#B9E9F6`** background per the design system (primary solid `#22C1EE` is reserved for primary CTAs elsewhere).
- **Implementation**: Styling SHALL **prefer Tailwind CSS** utilities where practical.
- **Interaction**: **Every interactive element** on this page (including **Close position** and tab selection controls) SHALL provide a **`:hover`** affordance that subtly **increases brightness or scale to ~1.02** where applicable; **non-interactive** historical card surfaces MAY use the same **card** hover treatment as Active list cards. Focus-visible styling SHALL remain visible for keyboard users.

#### Scenario: Position cards match home list card treatment

- **WHEN** the user views the Active or Historical positions list
- **THEN** each row uses the same general card vocabulary as the home live-signals list (24px radius, light border, semi-transparent white fill, soft teal glow shadow, hover scale ~1.02)

#### Scenario: Close button matches secondary button spec

- **WHEN** the user sees the **Close position** button on an Active row
- **THEN** it uses pill radius and secondary ghost / `#B9E9F6` or `#22C1EE` border treatment per the design system, not sharp corners
