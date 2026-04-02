## ADDED Requirements

### Requirement: Pair close uses two reduce-only market orders at full leg size

For **pair close** (exit a tracked long/short pair), the system SHALL submit **two** separate Pacifica **create market order** requests: one that **reduces** the **long** position on symbol A to zero and one that **reduces** the **short** position on symbol B to zero, using **`reduce_only`** semantics consistent with Pacifica documentation. Order **sizes** SHALL be derived from the user’s **current** open position amounts on Pacifica for each symbol (from **Get positions** or equivalent data already merged for the positions row). The system SHALL **not** perform a partial close of only one leg while leaving the other open when invoked from the **Close position** flow.

#### Scenario: Two separate closing orders

- **WHEN** the user completes pair close successfully
- **THEN** the client (or proxy chain) has performed two successful create-market submissions with reduce-only intent, one per leg

#### Scenario: Full size per leg

- **WHEN** Pacifica reports open long size on symbol A and open short size on symbol B for the pair
- **THEN** each closing order uses amounts that fully close that leg’s reported position

### Requirement: Pair close success is defined only when both legs close

The system SHALL treat the **pair close** action as successful for UI and storage cleanup purposes only when **both** required **create market order** submissions for closing succeed. If either fails, the system SHALL **not** remove the slug from active pair storage or claim success.

#### Scenario: One leg fails

- **WHEN** the first closing order succeeds and the second returns an error
- **THEN** the flow ends in error state, active pair storage is unchanged by this action, and the user can retry

### Requirement: Pair close uses API agent signing

The system SHALL perform pair **close** market order steps using **API Agent Key** signing and binding rules defined in capability **`pacifica-api-agent-keys`** (same model as pair open).

#### Scenario: Agent signs close payloads

- **WHEN** executing pair close after agent bind is complete
- **THEN** each create-market payload for closing is signed with the agent key per existing proxy contracts
