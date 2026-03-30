## ADDED Requirements

### Requirement: Trade execution uses total notional split by slug allocations

The system SHALL compute **total notional** for opening a pair position as **position size** (user-entered USD collateral amount) multiplied by **selected leverage** (positive integer). The system SHALL allocate **long** notional to **slug token A** and **short** notional to **slug token B** in proportion to **allocation A** and **allocation B** (integer percentages from the route slug). **Allocation percentages** SHALL sum to **100** for valid slugs.

#### Scenario: Split matches user example

- **WHEN** the slug is `SOL:20-ETH:80`, position size is **10** USD, and leverage is **10**
- **THEN** total notional is **100** USD, the **long SOL** leg targets **20** USD notional, and the **short ETH** leg targets **80** USD notional before exchange rounding

### Requirement: Leverage is updated for both symbols before orders

The system SHALL call Pacifica **update leverage** (REST) for **each** of the two Pacifica symbols corresponding to slug token A and token B with the **same** leverage value the user selected on the signal detail page, bounded by **effective maximum leverage** from `pacifica-market-metadata`. The system SHALL complete both updates **before** submitting **open** market orders for that action, unless the API documentation permits a single combined call (if not, two sequential or parallel updates are acceptable).

#### Scenario: Two symbols receive selected leverage

- **WHEN** the user selects **10x** and both symbols support at least **10x**
- **THEN** the system requests leverage **10** for symbol A and **10** for symbol B prior to order submission

### Requirement: Batch market open for long and short legs

The system SHALL submit **one** Pacifica **batch order** request that includes a **market** order opening **long** exposure on symbol A and a **market** order opening **short** exposure on symbol B, using side/direction semantics defined by Pacifica’s **create market order** documentation. If the batch endpoint cannot represent both legs in one request, the system SHALL still achieve the same user-visible outcome by submitting the minimum number of documented REST calls without changing sizing rules.

#### Scenario: Both legs submitted in one batch

- **WHEN** batch order is supported for two market orders
- **THEN** the client or server sends a single batch payload containing the long and short market orders

### Requirement: Order quantities respect cached market info

The system SHALL use **cached market info** (per `pacifica-market-metadata`) for each symbol—including **minimum lot**, **minimum tick**, **minimum order size**, and **maximum leverage**—when converting target USD notionals into **order quantities** and any required **price** fields, consistent with Pacifica **tick and lot size** rules. The system SHALL not submit orders that violate documented minima when avoidable through rounding or clamping; if targets cannot be met, the system SHALL refuse submission and show a clear error without partial undocumented rounding.

#### Scenario: Below minimum order size blocks submit

- **WHEN** rounded quantity for either leg is below that symbol’s **minimum order size**
- **THEN** the system does not submit the batch and informs the user that size is too small for the exchange rules

### Requirement: Trade sequence outcome before persisting active position

The system SHALL treat the **trade action** as successful for persistence purposes only when **all** required steps succeed: **update leverage** for both symbols (per contract of the API) **and** acceptance of the **order submission** response for both legs (batch or equivalent). On any step failure, the system SHALL **not** add an **active pair position** entry for that slug.

#### Scenario: Batch failure does not record active position

- **WHEN** leverage updates succeed but the order API returns an error
- **THEN** no new active-position record is written for the current slug

### Requirement: Errors are surfaced without silent failure

The system SHALL present a **visible error state** to the user when leverage update or order submission fails, without claiming success. The system SHALL avoid exposing raw secrets or full server traces in the UI.

#### Scenario: User sees failure after API error

- **WHEN** Pacifica returns an error for leverage or orders
- **THEN** the Open position flow ends in an error state and the user can retry after correcting input or waiting
