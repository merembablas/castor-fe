## ADDED Requirements

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

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Batch market open for long and short legs

**Reason:** Replaced by two sequential single-market creates aligned with API Agent Key usage and product direction.

**Migration:** Call Pacifica create-market twice (long, then short—or the order defined in implementation) with separate per-request signatures; remove dependence on `orders/batch` for opening the pair.
