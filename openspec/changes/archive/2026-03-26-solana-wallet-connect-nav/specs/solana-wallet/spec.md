## ADDED Requirements

### Requirement: Global wallet control in app header

The system SHALL expose a Solana wallet entry point in the main application header so it appears on every route that uses the root layout alongside existing primary navigation.

#### Scenario: User views any top-level page

- **WHEN** the user loads any page that uses the root layout
- **THEN** the header SHALL show a wallet control affordance (e.g. “Connect wallet” or connected state) without navigating away from the current route

### Requirement: Connect and disconnect via supported wallets

The system SHALL allow the user to connect a Solana wallet using adapter-supported browser wallets and SHALL allow the user to disconnect without leaving the site.

#### Scenario: User connects a wallet

- **WHEN** the user chooses connect and completes the wallet extension or in-wallet approval flow
- **THEN** the UI SHALL reflect a connected state and SHALL expose a way to disconnect or change wallet consistent with the chosen adapter library

#### Scenario: User disconnects

- **WHEN** the user chooses disconnect (or equivalent action provided by the integration)
- **THEN** the wallet session SHALL clear in the UI and the control SHALL return to a disconnected affordance

### Requirement: Client-safe integration with SvelteKit

The system SHALL not invoke browser-only wallet APIs during server-side rendering; wallet initialization SHALL occur only in a browser context so SSR and prerender remain valid.

#### Scenario: Server renders the page

- **WHEN** the page is rendered on the server
- **THEN** the application SHALL not throw due to missing `window` or wallet globals

### Requirement: Design system alignment for the primary control

The system SHALL style the primary wallet trigger to match the oceanic design system: pill shape (`rounded-full` or equivalent), primary fill `#22C1EE` with white foreground for the default disconnected CTA, readable text using `#144955` or `#527E88` where appropriate for secondary labels, soft teal glow shadow, and a hover state that subtly increases brightness or scale (e.g. ~1.02).

#### Scenario: User hovers the primary wallet button

- **WHEN** the user hovers or focuses the primary wallet control on a capable device
- **THEN** the control SHALL show a visible hover or focus treatment consistent with the design system (no sharp corners on the primary CTA)

### Requirement: Configurable Solana RPC

The system SHALL read the Solana JSON-RPC endpoint from public configuration (e.g. `PUBLIC_SOLANA_RPC_URL`) so deployments can target the intended cluster without code changes.

#### Scenario: Application uses configured RPC

- **WHEN** the wallet connection stack establishes a `Connection` (or equivalent) to Solana
- **THEN** it SHALL use the configured public RPC URL from environment with a documented fallback for local development

### Requirement: Accessible and mobile-usable controls

The system SHALL ensure the wallet control is operable with keyboard and screen readers where applicable (focusable trigger, discernible name) and SHALL meet a minimum touch target of approximately 44×44 CSS pixels on the main header control.

#### Scenario: Keyboard user focuses the wallet control

- **WHEN** the user moves focus to the wallet button using the keyboard
- **THEN** a visible focus indicator SHALL appear and activating it SHALL be possible via keyboard
