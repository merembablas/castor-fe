## Requirements

### Requirement: Trade execution uses total notional split by slug allocations

The system SHALL treat the signal-detail **total amount** (user-entered **USD** position size) as **total notional** for opening the pair (before per-leg rounding to exchange rules). The system SHALL **not** multiply that amount by leverage again when computing leg targets. **Margin** at the selected **leverage** (positive integer) SHALL equal **total notional divided by leverage**. The system SHALL allocate **long** notional to **slug token A** and **short** notional to **slug token B** in proportion to **allocation A** and **allocation B** (integer percentages from the route slug). **Allocation percentages** SHALL sum to **100** for valid slugs.

#### Scenario: Split matches user example

- **WHEN** the slug is `SOL:20-ETH:80`, total amount is **100** USD, and leverage is **10**
- **THEN** total notional is **100** USD, **margin** is **10** USD, the **long SOL** leg targets **20** USD notional, and the **short ETH** leg targets **80** USD notional before exchange rounding

#### Scenario: Equivalent to prior margin-times-leverage model

- **WHEN** under the prior product semantics the user entered **10** USD margin at **10×** leverage
- **THEN** the same leg targets are produced when total amount is **100** USD at **10×** leverage under this requirement

### Requirement: Leverage is updated for both symbols before orders

The system SHALL call Pacifica **update leverage** (REST) for **each** of the two Pacifica symbols corresponding to slug token A and token B with the **same** leverage value the user selected on the signal detail page, bounded by **effective maximum leverage** from `pacifica-market-metadata`. The system SHALL complete both updates **before** submitting **open** market orders for that action, unless the API documentation permits a single combined call (if not, two sequential or parallel updates are acceptable).

#### Scenario: Two symbols receive selected leverage

- **WHEN** the user selects **10x** and both symbols support at least **10x**
- **THEN** the system requests leverage **10** for symbol A and **10** for symbol B prior to order submission

### Requirement: Pair open uses two single market orders

The system SHALL submit **two** separate Pacifica **create market order** requests: one opening **long** exposure on symbol A and one opening **short** exposure on symbol B, using side/direction semantics defined by Pacifica’s **create market order** documentation. The system SHALL not combine those two legs into a single **batch** order request for this flow.

#### Scenario: Long and short are separate API calls

- **WHEN** the user completes open position successfully
- **THEN** the client (or proxy chain) has performed two successful create-market submissions, one per leg, after both leverage updates

### Requirement: Open-position flow uses API agent signing

The system SHALL perform **update leverage** and **create market order** steps in the pair open-position flow using **API Agent Key** signing and binding rules defined in capability **`pacifica-api-agent-keys`** (main `account`, agent-produced `signature`, `agent_wallet` present as required).

#### Scenario: Wallet extension not used for leverage or market payload signing

- **WHEN** executing open position after agent bind is complete
- **THEN** leverage and market order payloads are signed with the agent key, not the browser wallet `signMessage` adapter

### Requirement: Order quantities respect cached market info

The system SHALL use **cached market info** (per `pacifica-market-metadata`) for each symbol—including **minimum lot**, **minimum tick**, **minimum order size**, and **maximum leverage**—when converting target USD notionals into **order quantities** and any required **price** fields, consistent with Pacifica **tick and lot size** rules. The system SHALL not submit orders that violate documented minima when avoidable through rounding or clamping; if targets cannot be met, the system SHALL refuse submission and show a clear error without partial undocumented rounding.

#### Scenario: Below minimum order size blocks submit

- **WHEN** rounded quantity for either leg is below that symbol’s **minimum order size**
- **THEN** the system does not submit the market orders and informs the user that size is too small for the exchange rules

### Requirement: Trade sequence outcome before persisting active position

The system SHALL treat the **trade action** as successful for persistence purposes only when **all** required steps succeed: **update leverage** for both symbols (per contract of the API) **and** acceptance of **both** single **create market order** submissions (long leg and short leg). On any step failure, the system SHALL **not** add an **active pair position** entry for that slug.

#### Scenario: Order submission failure does not record active position

- **WHEN** leverage updates succeed but either market order API returns an error
- **THEN** no new active-position record is written for the current slug

### Requirement: Errors are surfaced without silent failure

The system SHALL present a **visible error state** to the user when leverage update or order submission fails, without claiming success. The system SHALL avoid exposing raw secrets or full server traces in the UI.

#### Scenario: User sees failure after API error

- **WHEN** Pacifica returns an error for leverage or orders
- **THEN** the Open position flow ends in an error state and the user can retry after correcting input or waiting

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
