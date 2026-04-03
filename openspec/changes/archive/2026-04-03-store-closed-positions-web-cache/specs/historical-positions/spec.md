## ADDED Requirements

### Requirement: Closed pair positions are persisted as historical records in browser web cache

The system SHALL maintain a **client-side** list of **historical closed pair positions** in **web cache** (`localStorage` or the project’s single abstraction over it), separate from **`castor:activePairPositions`**. Each historical record SHALL be **immutable after write** (corrections are out of scope unless a future requirement adds them). The system SHALL **append** a new historical record when a pair transitions from **tracked open** to **closed** in app logic (including when the user successfully closes both legs and when reconciliation removes a slug because Pacifica no longer reports required open legs), **provided** the implementation can resolve **minimum required fields** defined in this capability.

#### Scenario: Successful close creates a historical entry

- **WHEN** the application completes closing **both** legs of a pair and removes that pair’s **slug** from **`castor:activePairPositions`**
- **THEN** a new historical record is written to the historical web-cache store containing that slug, leg symbols, allocations, opened and closed datetimes, realized P&L, and net funding paid as specified in the following requirements

#### Scenario: Reconciliation-driven removal may create a historical entry

- **WHEN** reconciliation removes a slug from **`castor:activePairPositions`** because Pacifica indicates the pair is no longer open per existing positions rules
- **THEN** the system SHALL attempt to append a historical record with the same field requirements when sufficient data is available; when data is insufficient, the system SHALL **not** fabricate a record

### Requirement: Each historical record includes pair identity, symbols, and allocations

Each historical record SHALL include:

- The pair **`slug`** string, using the **same** slug identifier as **`ActivePairPosition.slug`** and **`/signal/[slug]`** routes.
- The **long** leg **symbol** and **short** leg **symbol** as used for Pacifica position resolution for that row.
- The **allocation percentage** for the long leg and for the short leg, consistent with pair/slug metadata used on the positions row.

#### Scenario: Record contains slug and both legs

- **WHEN** a historical record is written
- **THEN** it includes non-empty `slug`, long symbol, short symbol, and both allocation values matching the pair metadata for that slug

### Requirement: Each historical record includes opened time, closed time, realized P&L, and funding paid

Each historical record SHALL include:

- **`openedAt`**: instant when the pair was opened for the user, aligned with **`openedAt`** from active pair storage **when available**, otherwise a clearly defined fallback (e.g. earliest known open instant from Pacifica-derived row data) documented in implementation.
- **`closedAt`**: instant when the record is written for the close event (or the instant the app determines the pair closed, if that is measurably earlier and available—implementation SHALL document the chosen rule and keep it consistent).
- **Realized P&L** for the closed pair as a **numeric** value in **US dollars** at close, using the same conceptual basis as realized/closed P&L shown or computed in the positions UI at close time (not a new ad-hoc formula).
- **Funding paid** as a **single numeric** value in **US dollars** representing the **net** funding paid across **both** legs, consistent with the **sum** of per-leg Pacifica **`funding`** values (after parsing) used for the open row’s net funding display, captured at close when available.

#### Scenario: Record includes temporal and P&L fields

- **WHEN** a historical record is written with full data
- **THEN** it includes `openedAt`, `closedAt`, realized P&L (USD), and net funding paid (USD)

### Requirement: Historical store is bounded and safe to parse

The historical list SHALL be stored under a **single dedicated application key** (distinct from **`castor:activePairPositions`**). Reads SHALL use **defensive parsing** (invalid or legacy JSON SHALL yield an **empty** list or ignorable entries, not throw). The implementation SHALL enforce a **maximum number** of retained records by **dropping oldest** entries when the cap is exceeded. Writes SHALL handle **`localStorage`** failures (e.g. quota) without breaking the close flow; behavior on failure (user-visible error vs silent skip) SHALL be consistent with project patterns for storage errors.

#### Scenario: Corrupt storage does not crash the app

- **WHEN** the historical key contains invalid JSON or an unexpected shape
- **THEN** the reader returns no usable records or only valid entries and the application does not throw during normal page load

#### Scenario: Cap prevents unbounded growth

- **WHEN** the number of historical records would exceed the configured maximum
- **THEN** the oldest records are removed (or not written per documented merge rules) so the stored list does not grow past the cap
