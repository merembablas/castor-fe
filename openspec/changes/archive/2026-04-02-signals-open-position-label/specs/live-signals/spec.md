## ADDED Requirements

### Requirement: Live signal card shows label when active pair cache contains the signal slug

When the user views the live signals list on `/`, each signal card whose navigable slug exists in **`castor:activePairPositions`** (same slug string as used for `/signal/[slug]` and as stored in **`ActivePairPosition.slug`**) SHALL show a **non-primary** informational **pill** (badge) indicating that the user **already has this pair tracked as an active open position** in app storage. The pill SHALL include **both** a **small icon** and **short text** (not text alone without icon). The treatment SHALL conform to **live-signals** design-system rules: **full pill** radius, oceanic palette (`#22C1EE` / `#B9E9F6` accents, `#144955` / `#527E88` text as appropriate), **no** heavy black drop shadow, and a **subtle** hover/affordance consistent with other non-primary chips on the card where the chip is interactive; if the chip is non-interactive, it SHALL remain visually distinct and readable. When the slug is **not** present in active pair storage, the pill SHALL **not** be shown.

#### Scenario: Cached active slug shows pill with icon

- **WHEN** a live signal row’s slug matches an entry in `castor:activePairPositions`
- **THEN** the card displays the informational pill with icon and short label, using pill radius and colors consistent with design-system-ui-ux

#### Scenario: No cache entry hides pill

- **WHEN** the signal’s slug is absent from `castor:activePairPositions`
- **THEN** the card does not show the active-position pill

#### Scenario: Storage update updates label without full page reload

- **WHEN** `castor:activePairPositions` changes in the browser (e.g. another tab via `storage` event or same-tab write after open/close flows)
- **THEN** the live signals list updates which cards show the pill accordingly on subsequent render without requiring a manual full page reload
