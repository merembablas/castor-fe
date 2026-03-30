## ADDED Requirements

### Requirement: Pairs page route

The system SHALL expose a **`/pairs`** route that renders a list of trading pairs from the backend feed.

#### Scenario: Successful load

- **WHEN** the server successfully obtains pair data
- **THEN** the page renders a list with one item per pair in the API `data` array.

### Requirement: Server-side fetch and fifteen-minute cache

The system SHALL fetch pair JSON from a **configurable base URL** on the **server** (SvelteKit `load` or equivalent) and SHALL **not** refetch from that origin more than once per **fifteen minutes** per server runtime instance for normal operation (in-memory TTL of 900 seconds unless a shared cache is introduced later).

#### Scenario: Repeated visits within TTL

- **WHEN** two requests hit the pairs `load` within fifteen minutes after a successful fetch
- **THEN** the second request SHALL be served from cache without a new upstream HTTP request to the pairs API.

### Requirement: Pair item shows long and short symbols with allocation percent

Each list item SHALL show **long** and **short** symbols. The long leg SHALL be labeled from **`symbol_a`** and the short from **`symbol_b`**. Each leg SHALL display an **allocation percent** derived from **`coint_coefficient`** β as: `pct_a = (100 * |β|) / (|β| + 1)` and `pct_b = 100 / (|β| + 1)`, presented as user-readable percentages (rounded for display, summing to approximately 100%).

#### Scenario: Display allocations

- **WHEN** a pair has `symbol_a`, `symbol_b`, and `coint_coefficient`
- **THEN** the UI shows both symbols with their computed allocation percents alongside long/short labels.

### Requirement: Categories for both symbols

Each list item SHALL show **categories** for **both** symbols, sourced from `market_a.categories` and `market_b.categories` respectively.

#### Scenario: Categories visible

- **WHEN** categories arrays are present and non-empty
- **THEN** the UI lists or chips them per leg without losing association to the correct symbol.

### Requirement: Statistical fields

Each list item SHALL display **ADF statistic** (`adf_statistic`), **ADF p-value** (`adf_p_value`), **zero crossings** (`zero_crossings`), and **mean crossing time** (`mean_crossing_time`).

#### Scenario: Stats row

- **WHEN** the pair object includes these fields
- **THEN** they are visible on the item in readable form (numeric formatting appropriate to magnitude).

### Requirement: Last updated datetime

Each list item SHALL show a **last updated** time computed as the **latest** of `market_a.updated_at` and `market_b.updated_at` (ISO 8601), formatted consistently with other date/time displays in the app. If both are missing or invalid, the system MAY fall back to `meta.generated_at` when available.

#### Scenario: Stale leg times

- **WHEN** `market_a.updated_at` and `market_b.updated_at` differ
- **THEN** the displayed “last updated” reflects the more recent timestamp.

### Requirement: Funding fields for both legs

Each list item SHALL show **current funding** and **next funding** for **both** legs using `market_a.funding`, `market_a.next_funding`, `market_b.funding`, and `market_b.next_funding` (string or numeric values as returned, formatted readably).

#### Scenario: Funding displayed per symbol

- **WHEN** funding fields are present
- **THEN** the user can see current and next funding associated with the long leg and with the short leg.

### Requirement: Error and empty states

The pairs page SHALL handle **upstream failure**, **invalid JSON**, and **empty `data`** with user-visible messaging (no uncaught server errors in normal operation) and styling aligned with existing list error patterns.

#### Scenario: API error

- **WHEN** the upstream pairs request fails or returns unusable data
- **THEN** the page shows an error message and does not render a broken list.

### Requirement: Design system compliance

The pairs list and page chrome SHALL follow **`.cursor/rules/design-system-ui-ux.mdc`**: oceanic teal palette, **24px** rounded cards (or equivalent list rows), **pill** interactive elements where appropriate, soft teal **glow** shadows, primary text **`#144955`**, secondary **`#527E88`**, and **hover** feedback (~**1.02** scale or subtle brightness) on interactive controls.

#### Scenario: Visual consistency

- **WHEN** a user views `/pairs` on mobile and desktop widths
- **THEN** typography and colors match the documented design system and remain readable without horizontal overflow.
