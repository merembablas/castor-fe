## Requirements

### Requirement: Signal URL encodes two tokens and allocations

The system SHALL expose a detail page at `/signal/[slug]` where `slug` matches the pattern `TOKEN_A:ALLOCATION_A-TOKEN_B:ALLOCATION_B`. `TOKEN_A` and `TOKEN_B` SHALL be non-empty strings consisting of alphanumeric characters. `ALLOCATION_A` and `ALLOCATION_B` SHALL be integer percentages in the inclusive range 0–100. The page SHALL interpret the slug as token A with allocation A and token B with allocation B in left-to-right order.

#### Scenario: Valid slug loads detail view

- **WHEN** the user navigates to `/signal/ETH:25-SOL:75`
- **THEN** the system parses token A as `ETH`, allocation A as `25`, token B as `SOL`, allocation B as `75`, and renders the signal detail view with those values

#### Scenario: Malformed slug is rejected

- **WHEN** the user navigates to a path that does not match the required pattern (e.g. missing a segment, non-numeric allocation, or empty token)
- **THEN** the system does not render the signal detail content as valid data and SHALL respond with an appropriate error state (e.g. HTTP 404 or an in-app error boundary) without exposing partial misleading allocations

### Requirement: Signal detail presents pair summary, chart, entry, description, and CTA

The signal detail view SHALL display token A and token B with their respective allocations, a candlestick chart for **weighted two-leg price ratio** context backed by **Pacifica REST kline history and Pacifica WebSocket candle updates** (see `pacifica-weighted-candles` capability), an entry price, a textual description, and a primary control labeled for opening a position. The chart SHALL use default candle **`1h`** interval. The layout SHALL remain usable on narrow viewports (no required horizontal scrolling for the main card content). The view SHALL present distinguishable states when market data is loading, unavailable, or failed (e.g. message or skeleton), without implying that placeholder data is live.

#### Scenario: Required content is visible

- **WHEN** the signal detail page is shown for a valid slug
- **THEN** the user sees token A and B with their allocation percentages, a candlestick chart region fed by the weighted ratio series when data is available, entry price, description, and an **Open position** (or equivalent) action

#### Scenario: Mobile-friendly layout

- **WHEN** the viewport is narrow (typical mobile width)
- **THEN** the chart and controls remain readable and tappable without breaking the primary card layout

#### Scenario: Chart reflects live weighted ratio

- **WHEN** Pacifica data is successfully loaded for both symbols
- **THEN** the candlestick chart displays synthetic OHLC derived from the weighted ratio formula with long/short exponents from the slug allocations and updates as WebSocket candle messages arrive

#### Scenario: Data failure is visible

- **WHEN** Pacifica REST or WebSocket data cannot be obtained for one or both symbols
- **THEN** the chart area shows an explicit loading or error state and does not present fabricated live candles

### Requirement: Visual design aligns with project design system

The signal detail page and its card SHALL follow the rules in `.cursor/rules/design-system-ui-ux.mdc`: oceanic teal/blue palette; card corners at 24px radius (or Tailwind equivalent); pill controls at full radius; primary CTA solid `#22C1EE` with white foreground; primary text `#144955` and secondary `#527E88`; soft teal-tinted shadow/glow instead of heavy black shadows; glassmorphism for floating UI where appropriate (`backdrop-filter` blur ~12px with semi-transparent light background); chart coloring using soft gradients between `#22C1EE` and `#144955`; interactive elements SHALL have a hover state that subtly increases brightness or scale to approximately 1.02.

#### Scenario: Primary button matches design system

- **WHEN** the user views the Open position control
- **THEN** it uses pill shape, primary fill `#22C1EE`, white label, and a visible hover affordance consistent with the design system

#### Scenario: Card and typography match design system

- **WHEN** the user views the signal detail card
- **THEN** the card uses the prescribed radius and shadow treatment, and headings/body use the specified high-contrast and secondary text colors
