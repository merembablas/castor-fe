## ADDED Requirements

### Requirement: Pacifica agent wallet setup is part of connect readiness

The system SHALL integrate **Pacifica API Agent Key** setup into the wallet connection journey so that a user who wishes to trade from the app completes **agent keypair persistence** and **bind_agent_wallet** (main-wallet signature) as part of reaching a **trading-ready** connected state. Until bind succeeds for the current main account, the system SHALL treat Pacifica trading actions that require agent signing as unavailable or SHALL surface a clear prompt to complete setup.

#### Scenario: Connected wallet without bind cannot silently fail trades

- **WHEN** the wallet shows connected but agent bind has not succeeded
- **THEN** initiating open position either completes bind first with user consent or shows an explicit error or CTA, without sending leverage or market requests that assume a bound agent

#### Scenario: Successful connect path includes agent readiness

- **WHEN** the user connects a wallet and completes the bind signature when prompted
- **THEN** the app stores the agent key material per `pacifica-api-agent-keys` and subsequent trading flows do not require additional main-wallet signatures for leverage or market order payloads
