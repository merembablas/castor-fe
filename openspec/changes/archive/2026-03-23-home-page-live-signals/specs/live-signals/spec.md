## ADDED Requirements

### Requirement: App header exposes Live, Positions, and Archives navigation

The system SHALL render a persistent header on primary app routes that includes three navigation entries labeled **Live signals**, **Positions**, and **Archives**, linking respectively to `/`, `/positions`, and `/archives`. The entry whose route matches the current path SHALL be visually indicated as active. The header and nav SHALL remain usable on narrow viewports without horizontal scrolling for the primary nav row.

#### Scenario: Live signals is active on home

- **WHEN** the user is on `/`
- **THEN** the **Live signals** nav entry is shown as active and **Positions** and **Archives** are not

#### Scenario: Stub routes resolve for secondary nav

- **WHEN** the user navigates to `/positions` or `/archives`
- **THEN** the system renders a dedicated page for that path (placeholder content is acceptable) and the corresponding nav entry is shown as active

### Requirement: Home page lists new signals with navigation to detail

The system SHALL display on `/` a list of signal entries. For this release the list SHALL contain at least three items sourced from static or in-memory dummy data. Each entry SHALL be implemented as a control that navigates to `/signal/[slug]` where `slug` conforms to the existing signal detail URL pattern (`TOKEN_A:ALLOCATION_A-TOKEN_B:ALLOCATION_B` with integer percentages 0–100).

#### Scenario: Dummy rows link to valid detail slugs

- **WHEN** the user views the home page
- **THEN** at least three list items are shown and each navigates to a valid `/signal/...` URL that the signal detail page can parse

#### Scenario: Row shows pair, time, and summary line

- **WHEN** a list item is displayed
- **THEN** the user sees token A and token B with their allocation percentages, a generated datetime for the signal, and a single-line description

### Requirement: Long and short legs are visually distinct

The system SHALL present token A as the **long** leg and token B as the **short** leg. The list item UI SHALL differentiate the two legs using distinct visual treatment including **iconography or badges** and **color** so that long and short are distinguishable at a glance while remaining consistent with the project design system (oceanic teal palette, readable contrast).

#### Scenario: Long and short are distinguishable

- **WHEN** the user views a signal row on the home list
- **THEN** the long leg (token A) and short leg (token B) use non-identical visual styling that includes both semantic labeling (e.g. long/short or equivalent) and differing accent colors or icons

### Requirement: Live signals UI conforms to design-system-ui-ux

The home page experience—the persistent **header**, **navigation**, **signal list** rows or cards, and any **buttons** introduced in this capability—SHALL conform to `.cursor/rules/design-system-ui-ux.mdc`. Normatively:

- **Theme**: The UI SHALL use a serene, trustworthy **oceanic** palette (soft teals and blues); long/short accents SHALL remain within that palette and maintain readable contrast.
- **Radius**: **Card-like** list surfaces and containers SHALL use **24px** corner radius (or Tailwind/CSS equivalent). **Pill-shaped** controls (e.g. nav items, badges, inputs styled as pills) SHALL use **full pill** radius (equivalent to `border-radius: 9999px`).
- **Glassmorphism**: The persistent **header** SHALL be treated as **floating UI** and SHALL use **`backdrop-filter` blur ~12px** and a **semi-transparent light background** (e.g. `rgba(255, 255, 255, 0.4)`), matching the rule file (Tailwind/CSS equivalents acceptable).
- **Buttons**: Any **primary** action control SHALL use solid **`#22C1EE`** fill with **white** text and no sharp corners. **Secondary** controls SHALL use **ghost** style with **`#22C1EE`** border and/or semi-transparent **`#B9E9F6`** background as specified in the rule file.
- **Typography**: Text SHALL use a **sans-serif** face (e.g. Inter, Montserrat, or Lexend or project default matching that intent). **Main headings** SHALL be **semi-bold** with **tight letter-spacing**. **High-contrast** text SHALL use **`#144955`**; **secondary** text SHALL use **`#527E88`**.
- **Shadows**: Elevation on cards or floating elements SHALL use a **soft teal-tinted glow** (e.g. `box-shadow: 0 10px 30px -10px rgba(34, 193, 238, 0.2)`) and SHALL **not** rely on heavy black shadows.
- **Implementation**: Styling SHALL **prefer Tailwind CSS** utilities where practical, consistent with the rule file.
- **Interaction**: **Every interactive element** in this flow (including nav links and list rows) SHALL provide a **`:hover`** affordance that subtly **increases brightness or scale to ~1.02**; focus-visible styling SHALL remain visible for keyboard users.

#### Scenario: List surfaces use prescribed radius and shadow

- **WHEN** the user views the live signals list
- **THEN** each signal row or card uses **24px** (or equivalent) corner radius for its container and, if elevated, uses a **soft teal glow** shadow consistent with `rgba(34, 193, 238, 0.2)`-style treatment—not a heavy black drop shadow

#### Scenario: Typography matches rule file colors

- **WHEN** the user views the home page and list
- **THEN** primary headings and dominant labels use **`#144955`** (or equivalent token) and secondary/meta text (e.g. timestamps) uses **`#527E88`** (or equivalent), with sans-serif and semi-bold headings as specified

#### Scenario: Nav and interactive rows have hover affordance

- **WHEN** the user uses a pointer device over navigation entries or over a tappable signal row
- **THEN** the target shows a subtle **brightness or scale ~1.02** change on hover

#### Scenario: Header uses glassmorphism

- **WHEN** the user views a page that includes the persistent app header
- **THEN** the header applies **backdrop blur ~12px** and a **semi-transparent light background** (e.g. `rgba(255, 255, 255, 0.4)`) consistent with the design system

#### Scenario: Primary and secondary controls match button spec

- **WHEN** the user sees a primary or secondary button on pages covered by this capability (including placeholder pages if they include actions)
- **THEN** primary buttons use **`#22C1EE`** with white text and pill/full-radius corners; secondary buttons match ghost **`#22C1EE`** border or **`#B9E9F6`** background treatment per the design system
