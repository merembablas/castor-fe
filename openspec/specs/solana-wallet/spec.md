# solana-wallet Specification

## Purpose

In-app Solana wallet connection state in the global header: connect/disconnect via browser wallet (Phantom), SSR-safe wiring, configurable RPC, and design-system-aligned controls.
## Requirements
### Requirement: Global wallet control in app header

The system SHALL expose a Solana wallet entry point in the main application header so it appears on every route that uses the root layout alongside existing primary navigation, visually grouped toward the trailing end of the header on wide viewports.

#### Scenario: User views any top-level page

- **WHEN** the user loads any page that uses the root layout
- **THEN** the header SHALL show a wallet control affordance (e.g. “Connect wallet” or connected state) without navigating away from the current route

### Requirement: Connect and disconnect via supported wallets

The system SHALL allow the user to connect a Solana wallet using the adapter-backed browser wallet(s) shipped in this change and SHALL allow the user to disconnect without leaving the site.

#### Scenario: User connects a wallet

- **WHEN** the user chooses connect and completes the wallet extension or in-wallet approval flow
- **THEN** the UI SHALL reflect a connected state and SHALL expose a way to disconnect consistent with the adapter integration

#### Scenario: User disconnects

- **WHEN** the user chooses disconnect
- **THEN** the wallet session SHALL clear in the UI and the control SHALL return to a disconnected affordance

### Requirement: Client-safe integration with SvelteKit

The system SHALL not invoke browser-only wallet APIs during server-side rendering; wallet initialization SHALL occur only in a browser context so SSR and prerender remain valid.

#### Scenario: Server renders the page

- **WHEN** the page is rendered on the server
- **THEN** the application SHALL not throw due to missing `window` or wallet globals

### Requirement: Design system alignment for the primary control

The system SHALL style the primary wallet trigger to match the oceanic design system: pill shape (`rounded-full` or equivalent), primary fill `#22C1EE` with white foreground for the default disconnected call-to-action, readable text using `#144955` or `#527E88` where appropriate for secondary labels, soft teal glow shadow, and a hover state that subtly increases brightness or scale (approximately 1.02).

#### Scenario: User hovers the primary wallet button

- **WHEN** the user hovers or focuses the primary wallet control on a capable device
- **THEN** the control SHALL show a visible hover or focus treatment consistent with the design system (no sharp corners on the primary call-to-action)

### Requirement: Configurable Solana RPC

The system SHALL read the Solana JSON-RPC endpoint from public configuration (e.g. `PUBLIC_SOLANA_RPC_URL`) so deployments can target the intended cluster without code changes.

#### Scenario: Application uses configured RPC

- **WHEN** the wallet connection stack establishes a `Connection` (or equivalent) to Solana
- **THEN** it SHALL use the configured public RPC URL from environment with a documented fallback for local development

### Requirement: Accessible and mobile-usable controls

The system SHALL ensure the wallet control is operable with keyboard and assistive technology where applicable (focusable trigger, discernible accessible name) and SHALL meet a minimum touch target of approximately 44×44 CSS pixels on the main header control.

#### Scenario: Keyboard user focuses the wallet control

- **WHEN** the user moves focus to the wallet button using the keyboard
- **THEN** a visible focus indicator SHALL appear and activating it SHALL be possible via keyboard

### Requirement: Pacifica agent wallet setup is part of connect readiness

The system SHALL integrate **Pacifica API Agent Key** setup into the wallet connection journey so that a user who wishes to trade from the app completes **agent keypair persistence** and **bind_agent_wallet** (main-wallet signature) as part of reaching a **trading-ready** connected state. Until bind succeeds for the current main account, the system SHALL treat Pacifica trading actions that require agent signing as unavailable or SHALL surface a clear prompt to complete setup.

#### Scenario: Connected wallet without bind cannot silently fail trades

- **WHEN** the wallet shows connected but agent bind has not succeeded
- **THEN** initiating open position either completes bind first with user consent or shows an explicit error or CTA, without sending leverage or market requests that assume a bound agent

#### Scenario: Successful connect path includes agent readiness

- **WHEN** the user connects a wallet and completes the bind signature when prompted
- **THEN** the app stores the agent key material per `pacifica-api-agent-keys` and subsequent trading flows do not require additional main-wallet signatures for leverage or market order payloads

