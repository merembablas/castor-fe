## ADDED Requirements

### Requirement: Positions page lists open positions with dummy data

The system SHALL render a dedicated page at `/positions` that displays a vertical list of open positions. For this release the list SHALL contain exactly three items sourced from static or in-memory dummy data. The page SHALL be reachable from the existing **Positions** navigation entry in the app header.

#### Scenario: User opens Positions from navigation

- **WHEN** the user activates the **Positions** link in the main navigation
- **THEN** the browser navigates to `/positions` and the positions list page is shown

#### Scenario: Three dummy rows are visible

- **WHEN** the user views `/positions`
- **THEN** exactly three position rows are displayed

### Requirement: Each position row shows pair, allocations, times, size, and unrealized P&L

For each position row the system SHALL display:

- Token A as the **long** leg and token B as the **short** leg, each with its **allocation percentage**.
- A **generated** datetime and an **opened** datetime (each SHALL be visible and distinguishable by label or equivalent text).
- **Unrealized profit or loss** expressed as **percent** and as **US dollar** amount, both easy to scan.
- The **notional size** used to open the position, shown as a currency amount (e.g. a leading `$` and numeric value).

#### Scenario: Row includes all required fields

- **WHEN** a position row is rendered
- **THEN** the user sees long token A and short token B with their allocation percentages, generated time, opened time, unrealized P&L in percent and dollars, and opening size in dollars

### Requirement: Unrealized P&L uses green for profit and red for loss

The system SHALL style unrealized profit (positive P&L) with a **green** foreground treatment and unrealized loss (negative P&L) with a **red** foreground treatment. P&L text SHALL not rely on color alone (e.g. signed values or explicit profit/loss indicators SHALL accompany color).

#### Scenario: Profitable dummy position shows green styling

- **WHEN** a dummy position has positive unrealized P&L
- **THEN** its P&L percent and dollar display use green styling and a non-color-only cue (such as a leading plus sign or explicit positive formatting)

#### Scenario: Losing dummy position shows red styling

- **WHEN** a dummy position has negative unrealized P&L
- **THEN** its P&L percent and dollar display use red styling and a non-color-only cue (such as a leading minus sign or explicit negative formatting)

#### Scenario: Dummy set includes both profit and loss

- **WHEN** the user views the three dummy positions
- **THEN** at least one row shows unrealized profit and at least one row shows unrealized loss

### Requirement: Long and short legs are visually distinct on position rows

The system SHALL present token A as the **long** leg and token B as the **short** leg. Each position row SHALL differentiate the two legs using distinct visual treatment including **iconography or badges** and **color**, consistent with the home live-signals list pattern and the oceanic design palette.

#### Scenario: Long and short are distinguishable on positions

- **WHEN** the user views a position row
- **THEN** the long leg (token A) and short leg (token B) use non-identical styling that includes semantic labeling and differing accent colors or icons

### Requirement: Close position control appears on the right side of each row

Each position row SHALL include a **Close position** control. On viewports where horizontal space allows, the control SHALL appear on the **right side** of the row relative to the primary content (pair, times, P&L, size). The control SHALL remain reachable and tappable on narrow viewports (layout MAY stack vertically).

#### Scenario: Close control is present per row

- **WHEN** the user views `/positions`
- **THEN** each of the three rows includes a **Close position** control

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
