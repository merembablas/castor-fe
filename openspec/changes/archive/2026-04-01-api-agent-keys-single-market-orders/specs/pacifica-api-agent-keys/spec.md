## ADDED Requirements

### Requirement: Agent keypair generation and persistence

The system SHALL generate a cryptographically suitable **Ed25519/Solana-style keypair** to serve as the Pacifica **API agent wallet** when none exists for the connected main account. The system SHALL persist the **agent private key** (encoding consistent with the rest of the app, e.g. base58) and the **agent public key** in **client-side storage** scoped by the main wallet’s public key string so reconnecting the same wallet reuses the same agent without regenerating by default.

#### Scenario: New wallet gets a new agent key

- **WHEN** the user connects a main wallet for which no agent key is stored
- **THEN** the system generates a new agent keypair and persists it before completing the bind step

### Requirement: Bind agent wallet to main account

The system SHALL call Pacifica’s **bind agent wallet** endpoint with payload shape consistent with official documentation: include `agent_wallet` (agent public key), `account` (main public key), `timestamp`, `expiry_window`, and a `signature` produced by **signing the canonical message** with the **main wallet** (wallet extension), using operation type **`bind_agent_wallet`**. The system SHALL treat bind success as a prerequisite for using the agent to sign `update_leverage` and `create_market_order` on behalf of that `account`.

#### Scenario: User completes bind signature once

- **WHEN** the user approves the bind signature in the wallet
- **THEN** Pacifica accepts the bind request and the app marks the agent as **bound** for that main account

### Requirement: Agent-signed Pacifica REST mutations

For POST requests that Pacifica documents as agent-signable, the system SHALL set **`account`** to the **main wallet public key**, compute **`signature`** using the **agent private key** and the same message-construction rules as today’s Pacifica signing helper, and include **`agent_wallet`** (agent public key) exactly as required by the API (header and/or body per live contract). The system SHALL NOT use the browser wallet extension to sign `update_leverage` or `create_market_order` payloads during normal open-position flow after bind.

#### Scenario: Create market order signed by agent

- **WHEN** submitting a signed `create_market_order` after successful bind
- **THEN** the signature is produced with the stored agent private key and the request identifies both `account` and `agent_wallet` per Pacifica rules

#### Scenario: Update leverage signed by agent

- **WHEN** submitting `update_leverage` after successful bind
- **THEN** the signature is produced with the stored agent private key and the request identifies both `account` and `agent_wallet` per Pacifica rules

### Requirement: No server persistence of agent private key

The system SHALL NOT send the agent private key to the application server for persistence; signing material needed for agent signatures SHALL remain on the client except as required for in-memory use during a session.

#### Scenario: Proxy receives only signed payload

- **WHEN** the client calls a SvelteKit Pacifica proxy for leverage or create-market
- **THEN** the request body contains public fields and signature material appropriate for forwarding, and does not include the agent private key if the proxy is untrusted for secrets
