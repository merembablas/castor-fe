## ADDED Requirements

### Requirement: Pair open honors product minimum total and per-leg notional

Before submitting **update leverage** or **create market order** requests for a **pair open**, the system SHALL verify that the requested **total notional** is **at least $100** USD and that **long** (token A) and **short** (token B) **target USD notionals** implied by slug allocations are **each at least $10** USD (same split rules as **Trade execution uses total notional split by slug allocations**). If any check fails, the system SHALL **not** call Pacifica for that open action and SHALL surface a **clear, user-visible** error consistent with `signal-detail` minimum messaging.

#### Scenario: Below product total blocks execution

- **WHEN** the open-position flow is invoked with total notional **below $100** USD
- **THEN** no leverage or market order requests are sent for that open and the user sees an error explaining the **$100** minimum total

#### Scenario: Below product per-leg minimum blocks execution

- **WHEN** total notional is **at least $100** but **either** computed long or short target notional is **below $10** USD
- **THEN** no leverage or market order requests are sent for that open and the user sees an error explaining the **$10** minimum per leg
