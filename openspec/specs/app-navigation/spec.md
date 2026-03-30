## Requirements

### Requirement: Hamburger opens main navigation drawer

The application header SHALL provide a **menu button** (hamburger icon) with an accessible name (e.g. “Open menu”) that toggles a **navigation drawer**.

#### Scenario: Open and close drawer

- **WHEN** the user activates the menu button
- **THEN** the drawer becomes visible, focus moves into the drawer, and a backdrop/scrim is shown consistent with the design system (glass-friendly overlay).

#### Scenario: Close drawer

- **WHEN** the user activates a close control, presses Escape, or activates the backdrop (if click-outside-to-close is implemented)
- **THEN** the drawer is hidden and keyboard focus returns to the menu button (or another documented sensible element).

### Requirement: Drawer lists primary routes

The drawer SHALL list navigation links to **Live signals** (`/`), **Positions** (`/positions`), **Archives** (`/archives`), and **Pairs** (`/pairs`), using the app’s path resolution (`$app/paths`).

#### Scenario: Navigate from drawer

- **WHEN** the user activates a drawer link
- **THEN** the application navigates to the corresponding route and the drawer closes.

### Requirement: Active route indication

The drawer SHALL visually indicate which link corresponds to the **current route** (same behavior as the previous inline nav: distinct styling for active vs inactive).

#### Scenario: Active link on Pairs page

- **WHEN** the current URL path is `/pairs`
- **THEN** the Pairs link in the drawer is shown as active.

### Requirement: Responsive and accessible navigation

The drawer SHALL be usable on **small viewports** (touch targets at least ~44px height), SHALL not trap focus without a way to exit (Escape), and SHALL use appropriate **ARIA** roles/attributes for the menu button and drawer panel (`aria-expanded`, `aria-controls`, or equivalent pattern).

#### Scenario: Keyboard user

- **WHEN** a keyboard user opens the drawer
- **THEN** they can move focus through links with Tab and close with Escape without losing context of the main page.

### Requirement: Header layout with wallet

The header SHALL retain **Solana wallet connect / disconnect** (or equivalent) alongside the hamburger; the **previous horizontal pill nav** SHALL be removed in favor of the drawer so additional sections do not clutter the header.

#### Scenario: Wallet visible

- **WHEN** the user views the header on desktop and mobile widths
- **THEN** the wallet control remains available and the drawer is the primary navigation entry point.
