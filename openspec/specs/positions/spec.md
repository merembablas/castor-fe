## Requirements

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

### Requirement: Long and short legs are visually distinct on position rows

The system SHALL present token A as the **long** leg and token B as the **short** leg. Each position row SHALL differentiate the two legs using distinct visual treatment including **iconography or badges** and **color**, consistent with the home live-signals list pattern and the oceanic design palette.

#### Scenario: Long and short are distinguishable on positions

- **WHEN** the user views a position row
- **THEN** the long leg (token A) and short leg (token B) use non-identical styling that includes semantic labeling and differing accent colors or icons

### Requirement: Close position control appears on the right side of each row

Each position row SHALL include a **Close position** control. On viewports where horizontal space allows, the control SHALL appear on the **right side** of the row relative to the primary content (pair, times, P&L, size). The control SHALL remain reachable and tappable on narrow viewports (layout MAY stack vertically).

#### Scenario: Close control is present per row

- **WHEN** the user views `/positions` and at least one position row is displayed
- **THEN** each displayed row includes a **Close position** control

#### Scenario: Desktop layout places Close on the right

- **WHEN** the user views a position row on a typical desktop-width viewport
- **THEN** the **Close position** control is aligned to the right of the row’s main content block

### Requirement: Positions list UI conforms to design-system-ui-ux

The `/positions` page—the **position list** rows or cards, **typography**, and **buttons** (including **Close position**)—SHALL conform to `.cursor/rules/design-system-ui-ux.mdc`. Normatively:

- **Theme**: The UI SHALL use a serene, trustworthy **oceanic** palette; long/short accents SHALL remain within that palette with readable contrast.
- **Radius**: **Card-like** list surfaces SHALL use **24px** corner radius (or Tailwind/CSS equivalent). **Pill-shaped** controls (e.g. long/short chips, **Close position** button) SHALL use **full pill** radius (`border-radius: 9999px` or equivalent).
- **Shadows**: List cards SHALL use a **soft teal-tinted glow** (e.g. `0 10px 30px -10px rgba(34, 193, 238, 0.2)`) and SHALL NOT rely on heavy black shadows.
- **Typography**: **High-contrast** text SHALL use **`#144955`**; **secondary** meta text SHALL use **`#527E88`**; sans-serif and semi-bold headings as specified in the design system.
- **Buttons**: **Close position** SHALL use **secondary** styling: ghost with **`#22C1EE`** border and/or semi-transparent **`#B9E9F6`** background per the design system (primary solid `#22C1EE` is reserved for primary CTAs elsewhere).
- **Implementation**: Styling SHALL **prefer Tailwind CSS** utilities where practical.
- **Interaction**: **Every interactive element** on this page (including **Close position**) SHALL provide a **`:hover`** affordance that subtly **increases brightness or scale to ~1.02**; focus-visible styling SHALL remain visible for keyboard users.

#### Scenario: Position cards match home list card treatment

- **WHEN** the user views the positions list
- **THEN** each row uses the same general card vocabulary as the home live-signals list (24px radius, light border, semi-transparent white fill, soft teal glow shadow, hover scale ~1.02)

#### Scenario: Close button matches secondary button spec

- **WHEN** the user sees the **Close position** button
- **THEN** it uses pill radius and secondary ghost / `#B9E9F6` or `#22C1EE` border treatment per the design system, not sharp corners

### Requirement: Close position fully closes the pair and clears slug from active pair storage

When the user activates **Close position** on a row, the system SHALL submit exchange actions that **fully close** the **long** leg on token A’s Pacifica symbol and the **short** leg on token B’s Pacifica symbol, using **full** current position sizes from Pacifica **Get positions** for those symbols. The system SHALL **not** offer or perform **partial** closes for this control. The system SHALL use the same **API agent** signing and proxy patterns as the existing pair **open** flow unless documentation requires otherwise.

While a close is in progress for a row, the system SHALL prevent duplicate submission for that row (e.g. disabled control and/or visible busy state). On **failure** of either closing action, the system SHALL show a **visible** error and SHALL **not** remove the slug from **`castor:activePairPositions`**. On **success** of **both** closing actions, the system SHALL **remove** that row’s **slug** from **`castor:activePairPositions`** and SHALL **invalidate or remove client-side slug-scoped caches** used to treat that pair as open (at minimum the active-pair entry; extend to any other slug-keyed client store discovered during implementation). The positions list SHALL update to reflect the closed pair (row removed after storage removal and refresh).

#### Scenario: Successful close removes slug and row

- **WHEN** the user activates **Close position** and both leg-closing exchange actions succeed
- **THEN** the slug is removed from `castor:activePairPositions`, slug-scoped client caches for that pair are cleared as specified, and the row no longer appears after the list refreshes

#### Scenario: Failed close keeps slug and row

- **WHEN** either leg-closing exchange action fails
- **THEN** the user sees an error, the slug remains in `castor:activePairPositions`, and the row remains (subject to normal reconciliation if the exchange state already changed)

#### Scenario: No partial close

- **WHEN** the user activates **Close position**
- **THEN** the system closes each leg using the full open size from Pacifica for that symbol and does not prompt for a fraction of the position
