## MODIFIED Requirements

### Requirement: App header exposes Live, Positions, and Archives navigation

The system SHALL render a persistent header on primary app routes that includes three navigation entries labeled **Live signals**, **Positions**, and **Archives**, linking respectively to `/`, `/positions`, and `/archives`. The entry whose route matches the current path SHALL be visually indicated as active. The header and nav SHALL remain usable on narrow viewports without horizontal scrolling for the primary nav row.

#### Scenario: Live signals is active on home

- **WHEN** the user is on `/`
- **THEN** the **Live signals** nav entry is shown as active and **Positions** and **Archives** are not

#### Scenario: Positions route resolves

- **WHEN** the user navigates to `/positions`
- **THEN** the system renders a dedicated page for that path and the **Positions** nav entry is shown as active

#### Scenario: Archives route shows archived signals list

- **WHEN** the user navigates to `/archives`
- **THEN** the system renders the archived signals list loaded from the archives API per the **archived-signals** capability (not placeholder-only content), and the **Archives** nav entry is shown as active
