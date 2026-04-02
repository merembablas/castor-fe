## MODIFIED Requirements

### Requirement: Trade execution uses total notional split by slug allocations

The system SHALL treat the signal-detail **total amount** (user-entered **USD** position size) as **total notional** for opening the pair (before per-leg rounding to exchange rules). The system SHALL **not** multiply that amount by leverage again when computing leg targets. **Margin** at the selected **leverage** (positive integer) SHALL equal **total notional divided by leverage**. The system SHALL allocate **long** notional to **slug token A** and **short** notional to **slug token B** in proportion to **allocation A** and **allocation B** (integer percentages from the route slug). **Allocation percentages** SHALL sum to **100** for valid slugs.

#### Scenario: Split matches user example

- **WHEN** the slug is `SOL:20-ETH:80`, total amount is **100** USD, and leverage is **10**
- **THEN** total notional is **100** USD, **margin** is **10** USD, the **long SOL** leg targets **20** USD notional, and the **short ETH** leg targets **80** USD notional before exchange rounding

#### Scenario: Equivalent to prior margin-times-leverage model

- **WHEN** under the prior product semantics the user entered **10** USD margin at **10×** leverage
- **THEN** the same leg targets are produced when total amount is **100** USD at **10×** leverage under this requirement
