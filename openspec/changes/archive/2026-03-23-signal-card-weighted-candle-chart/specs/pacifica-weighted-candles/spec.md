## ADDED Requirements

### Requirement: Pacifica REST kline fetch for two symbols

The system SHALL retrieve historical candle data for two trading symbols using Pacifica’s REST endpoint `/api/v1/kline` with query parameters `symbol`, `interval`, `start_time`, and optional `end_time` as documented ([Get candle data](https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/markets/get-candle-data)). The default `interval` SHALL be `1h` unless a product-wide configuration overrides it. The system SHALL request the same `interval` and overlapping time range for both symbols and parse each candle’s `t`, `o`, `h`, `l`, `c` fields from successful responses.

#### Scenario: Successful dual fetch returns aligned bars

- **WHEN** the system requests klines for symbol A and symbol B with `interval` `1h` and a valid time window
- **THEN** it obtains two arrays of candles and can identify pairs that share the same start time `t` for merging

#### Scenario: REST error is surfaced to the chart consumer

- **WHEN** either kline request fails (network error, non-success payload, or HTTP error status)
- **THEN** the data layer exposes a failure state so the UI can show an error or empty chart state without fabricating candles

### Requirement: Pacifica WebSocket candle subscription for two symbols

The system SHALL subscribe to Pacifica’s `candle` channel for each of the two symbols using `method` `subscribe` and `params` including `source` `candle`, `symbol`, and `interval` matching the REST default (`1h`) ([Candle subscription](https://pacifica.gitbook.io/docs/api-documentation/api/websocket/subscriptions/candle)). The system SHALL apply incoming messages to update the in-memory series for the corresponding symbol keyed by candle start time `t`.

#### Scenario: Live update refreshes the latest bar

- **WHEN** a WebSocket message delivers candle data for one symbol with the same `t` as the current open bar
- **THEN** the system updates that symbol’s candle and recomputes the merged synthetic bar for that `t` for consumers

#### Scenario: New interval boundary appends a bar

- **WHEN** a WebSocket message delivers a candle with a new `t` not previously present for that symbol
- **THEN** the system stores the new candle and, when both symbols have data for that `t`, exposes a new merged synthetic bar

### Requirement: Weighted price ratio merge

The system SHALL compute a synthetic candle for each aligned start time `t` from token A and token B candles using allocation-derived exponents: exponent for token A SHALL be `allocationA / 100` (positive, long), and exponent for token B SHALL be `-allocationB / 100` (negative, short). Each of synthetic `open`, `high`, `low`, and `close` SHALL be computed as the product \(X_A^{w_A} \cdot X_B^{w_B}\) where \(X_A\) and \(X_B\) are the respective parsed positive numeric values of that leg’s `o`, `h`, `l`, or `c` field. The system SHALL skip or drop a bar if a required price is missing, non-finite, or not positive.

#### Scenario: Slug allocations drive exponents

- **WHEN** the signal represents 30% long on token A and 70% short on token B
- **THEN** \(w_A = 0.3\) and \(w_B = -0.7\) and the synthetic close uses \(c_A^{0.3} \cdot c_B^{-0.7}\) (and analogously for `o`, `h`, `l`)

#### Scenario: Unaligned bars are not merged

- **WHEN** a start time `t` exists for symbol A but not for symbol B in the current dataset
- **THEN** the system does not emit a synthetic candle for that `t` until both legs exist (no silent single-leg merge)

### Requirement: Connection resilience

The system SHALL detect WebSocket closure or repeated parse errors and attempt reconnection with a bounded backoff strategy. After reconnect, the system SHOULD reconcile recent history with REST for a short overlapping window to reduce gaps.

#### Scenario: Reconnect after disconnect

- **WHEN** the WebSocket connection drops unexpectedly
- **THEN** the system schedules a reconnect and, once restored, resumes subscriptions for both symbols
