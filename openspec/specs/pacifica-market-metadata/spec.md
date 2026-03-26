## Requirements

### Requirement: Pacifica market info is available per symbol with daily cache semantics

The system SHALL retrieve **market info** from the Pacifica REST API (documented under **Get Market Info**) for each **Pacifica symbol** required by the signal detail pair. For each symbol, the system SHALL retain at least **maximum leverage**, **minimum lot**, **minimum tick**, and **minimum order size** in a form suitable for UI and future order validation. Fetches for the same symbol SHALL be satisfied from **cache** when a cached entry is **not older than approximately twenty-four hours**, unless the implementation provides an explicit **force refresh** path (optional). The system SHALL NOT present cached values as live tick-by-tick data; stale-after-TTL behavior SHALL trigger a background or on-demand refresh.

#### Scenario: Cache hit avoids origin request

- **WHEN** market info for symbol **S** was fetched within the last twenty-four hours and a valid cache entry exists
- **THEN** the system uses the cached **maximum leverage**, **min lot**, **min ticks**, and **min order size** for **S** without requiring a new Pacifica REST call for that navigation

#### Scenario: Cache miss fetches from Pacifica

- **WHEN** no valid cache entry exists for symbol **S**
- **THEN** the system requests Pacifica market info for **S** and stores the result for subsequent use until TTL expiry

### Requirement: Effective leverage cap for two-leg signals

For a signal with **two** Pacifica symbols **A** and **B**, the system SHALL compute **effective maximum leverage** as the **minimum** of **A**’s maximum leverage and **B**’s maximum leverage from market metadata. This value SHALL be the upper bound for leverage selection on the signal detail page for opening a position (see `signal-detail` capability).

#### Scenario: Two symbols with different max leverage

- **WHEN** symbol **A** allows maximum leverage **20** and symbol **B** allows **10**
- **THEN** effective maximum leverage is **10**

#### Scenario: Sub-five max leverage

- **WHEN** effective maximum leverage is **3**
- **THEN** the upper bound for leverage selection is **3** (not rounded up to 5)
