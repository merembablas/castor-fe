## ADDED Requirements

### Requirement: Close position fully closes the pair and clears slug from active pair storage

When the user activates **Close position** on a row, the system SHALL submit exchange actions that **fully close** the **long** leg on token A’s Pacifica symbol and the **short** leg on token B’s Pacifica symbol, using **full** current position sizes from Pacifica **Get positions** for those symbols. The system SHALL **not** offer or perform **partial** closes for this control. The system SHALL use the same **API agent** signing and proxy patterns as the existing pair **open** flow unless documentation requires otherwise.

While a close is in progress for a row, the system SHALL prevent duplicate submission for that row (e.g. disabled control and/or visible busy state). On **failure** of either closing action, the system SHALL show a **visible** error and SHALL **not** remove the slug from **`castor:activePairPositions`**. On **success** of **both** closing actions, the system SHALL **remove** that row’s **slug** from **`castor:activePairPositions`** and SHALL **invalidate or remove client-side slug-scoped caches** used to treat that pair as open (at minimum the active-pair entry; extend to any other slug-keyed client store discovered during implementation). The positions list SHALL update to reflect the closed pair (row removed after storage removal and refresh).

#### Scenario: Successful close removes slug and row

- **WHEN** the user activates **Close position** and both leg-closing exchange actions succeed
- **THEN** the slug is removed from `castor:activePairPositions`, slug-scoped client caches for that pair are cleared as specified, and the row no longer appears after the list refreshes

#### Scenario: Failed close keeps slug and row

- **WHEN** either leg-closing exchange action fails
- **THEN** the user sees an error, the slug remains in `castor:activePairPositions`, and the row remains (subject to normal reconciliation if the exchange state already changed)

#### Scenario: No partial close

- **WHEN** the user activates **Close position**
- **THEN** the system closes each leg using the full open size from Pacifica for that symbol and does not prompt for a fraction of the position
