## ADDED Requirements

### Requirement: Signal card shows per-symbol news teaser

On `/`, each live signal row (card) SHALL, when news data is available for the signal’s **long** and **short** token symbols, show a **brief** news line for each leg: at most **one sentence** (or truncated equivalent) per symbol, labeled or grouped so the user can tell which line applies to the long leg and which to the short leg. When no summaries exist for a leg, the system SHALL omit that leg’s line or show a neutral empty state for that leg without blocking navigation. The teaser SHALL NOT list every summary from the API on the card.

#### Scenario: Both legs have news

- **WHEN** news data includes at least one summary for the long symbol and at least one for the short symbol
- **THEN** the card shows two short teaser lines (one per leg) that are each a single sentence or truncated equivalent

#### Scenario: One leg missing news

- **WHEN** news exists for only one of the two symbols
- **THEN** the card shows a teaser only for the symbol that has data and does not fabricate content for the other

### Requirement: Signal card provides overlay for all summaries for both symbols

Each live signal card SHALL include a **secondary** control (e.g. button or link-styled control) that opens an **in-page overlay** (modal dialog or equivalent) showing **all** summary items from the news feed for **both** the long and short symbols for that signal only. The overlay SHALL be **scrollable** if content overflows. Each summary item in the overlay MAY show associated `sourceLinks` as outbound links opening in a new tab. Closing the overlay SHALL be possible via a visible close control, **Escape**, and (where appropriate) backdrop activation, without navigating away from `/`. Opening the overlay SHALL NOT change the browser URL route.

#### Scenario: User opens all news

- **WHEN** the user activates the secondary control on a signal card
- **THEN** an overlay appears listing every summary for the long and short symbols, grouped or labeled by symbol, and the user remains on the home route

#### Scenario: User dismisses overlay

- **WHEN** the user closes the overlay using the close control, Escape, or backdrop
- **THEN** the overlay is removed and focus returns to a sensible element on the page

### Requirement: News overlay conforms to design-system-ui-ux

The news **teaser** text, the **secondary** control that opens the overlay, and the **overlay panel** (including backdrop treatment) SHALL conform to `.cursor/rules/design-system-ui-ux.mdc`: oceanic palette (`#144955` / `#527E88` text, `#22C1EE` accents), **24px** radius on the panel, **pill** radius on the secondary control, **glass-style** backdrop (e.g. blur ~12px and semi-transparent light surfaces), and **soft teal glow** shadow—not heavy black shadows. The secondary control SHALL match **ghost** or **secondary** button styling per the design system; the primary navigation to signal detail remains the main action for the row.

#### Scenario: Overlay styling

- **WHEN** the user opens the news overlay
- **THEN** the panel uses rounded corners consistent with **24px** card radius, readable contrast, and glass/backdrop styling consistent with the design system

#### Scenario: Secondary control styling

- **WHEN** the user views the news control on a signal card
- **THEN** it uses pill shape and secondary/ghost treatment with `#22C1EE` border or `#B9E9F6`-style background per the design system
