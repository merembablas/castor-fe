## ADDED Requirements

### Requirement: Backward-compatible market data REST origin

When a dedicated market data Pacifica REST origin is not configured, the system SHALL use the same configured Pacifica REST origin used for trading and other general Pacifica REST proxies for historical kline requests.

#### Scenario: Single REST base URL

- **WHEN** the deployment sets only the trading Pacifica REST base URL and does not set a distinct market data REST base URL
- **THEN** kline requests issued by the app use that same REST origin as today

### Requirement: Optional distinct market data REST origin

The system SHALL support configuring a Pacifica REST base URL used only for historical kline (`/api/v1/kline`) traffic that may differ from the REST base URL used for trading, account, orders, leverage, prices, and market-info proxies, so operators can target Pacifica test for trading while using production for kline when test does not expose candle history.

#### Scenario: Test trading with production klines

- **WHEN** the operator sets the trading REST base URL to Pacifica’s test API host and sets the market data REST base URL to Pacifica’s production API host
- **THEN** server-driven kline fetches and the kline API route use the production host and trading-related routes use the test host

## MODIFIED Requirements

### Requirement: Pacifica REST kline fetch for two symbols

The system SHALL retrieve historical candle data for two trading symbols using Pacifica’s REST endpoint `/api/v1/kline` at the effective **market data** Pacifica REST origin (dedicated market data base URL when configured, otherwise the same origin as trading REST per backward-compatible configuration), with query parameters `symbol`, `interval`, `start_time`, and optional `end_time` as documented ([Get candle data](https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/markets/get-candle-data)). The default `interval` SHALL be `1h` unless a product-wide configuration overrides it. The system SHALL request the same `interval` and overlapping time range for both symbols and parse each candle’s `t`, `o`, `h`, `l`, `c` fields from successful responses.

#### Scenario: Successful dual fetch returns aligned bars

- **WHEN** the system requests klines for symbol A and symbol B with `interval` `1h` and a valid time window
- **THEN** it obtains two arrays of candles and can identify pairs that share the same start time `t` for merging

#### Scenario: REST error is surfaced to the chart consumer

- **WHEN** either kline request fails (network error, non-success payload, or HTTP error status)
- **THEN** the data layer exposes a failure state so the UI can show an error or empty chart state without fabricating candles

### Requirement: Pacifica WebSocket candle subscription for two symbols

The system SHALL subscribe to Pacifica’s `candle` channel for each of the two symbols using `method` `subscribe` and `params` including `source` `candle`, `symbol`, and `interval` matching the REST default (`1h`) ([Candle subscription](https://pacifica.gitbook.io/docs/api-documentation/api/websocket/subscriptions/candle)), using the configured **market data** WebSocket URL exposed to the client for Pacifica candles (independent of the trading REST base URL). The system SHALL apply incoming messages to update the in-memory series for the corresponding symbol keyed by candle start time `t`.

#### Scenario: Live update refreshes the latest bar

- **WHEN** a WebSocket message delivers candle data for one symbol with the same `t` as the current open bar
- **THEN** the system updates that symbol’s candle and recomputes the merged synthetic bar for that `t` for consumers

#### Scenario: New interval boundary appends a bar

- **WHEN** a WebSocket message delivers a candle with a new `t` not previously present for that symbol
- **THEN** the system stores the new candle and, when both symbols have data for that `t`, exposes a new merged synthetic bar
