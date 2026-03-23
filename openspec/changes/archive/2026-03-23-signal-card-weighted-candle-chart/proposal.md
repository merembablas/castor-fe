## Why

The signal detail card’s chart does not yet reflect real market history or live updates. Traders need a candle series that matches the signal’s two-leg allocation (long vs short) so the chart represents the same economic exposure as the slug (for example `/signal/sol:30-eth:70`). Pacifica exposes historical candles over REST and live candles over WebSocket, which we can combine after computing a **weighted price ratio** from the two symbols.

## What Changes

- Bootstrap the chart with historical candles by calling Pacifica’s REST kline endpoint (`/api/v1/kline`) with `symbol`, `interval`, `start_time`, and optional `end_time` ([Get candle data](https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/markets/get-candle-data)).
- Subscribe to live candle updates per symbol via the Pacifica WebSocket `candle` channel (`method: subscribe`, `params.source: candle`, `symbol`, `interval`) ([Candle subscription](https://pacifica.gitbook.io/docs/api-documentation/api/websocket/subscriptions/candle)).
- Derive a **single synthetic OHLC series** for the chart by combining the two assets’ OHLC (or close-driven approximation where needed) using allocation weights: **long legs use positive exponents, short legs use negative exponents**, e.g. for 30% long SOL and 70% short ETH: ratio \(\propto \text{SOL}^{0.3} \cdot \text{ETH}^{-0.7}\) (using the slug’s percentage values as decimal weights with the correct sign per side). *Note: narrative examples sometimes use different numeric literals; implementation SHALL use the parsed allocation integers from the slug converted to decimals (e.g. 30 → 0.30) and the documented long/short sign rule.*
- Default candle **interval** is **1h** (`1h` in Pacifica’s allowed set: `1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 8h, 12h, 1d`).
- Improve the signal card / chart UX as needed for loading, error, and reconnect behavior when market data is unavailable.

## Capabilities

### New Capabilities

- `pacifica-weighted-candles`: Fetch aligned historical candles for two Pacifica symbols, merge updates from two WebSocket candle streams, compute weighted-ratio OHLC (or documented OHLC proxy), handle interval and time alignment, errors, and reconnection at the data layer.

### Modified Capabilities

- `signal-detail`: The candlestick chart SHALL represent the weighted two-token ratio derived from real Pacifica data (REST + WebSocket) with default `1h` interval, not placeholder or single-symbol mock data; requirements SHALL describe loading, empty, and error states for data fetch/subscription.

## Impact

- **Code**: `signal-detail-card.svelte`, `signal-candlestick-chart.svelte` (or successors), signal detail route/load as needed; new modules for Pacifica REST client, WebSocket client, weight parsing from `SignalDetailViewModel` / slug, and candle alignment math.
- **APIs**: Outbound calls to Pacifica REST and WebSocket (base URL and auth from env or config if required by deployment).
- **Dependencies**: Possibly a small chart/data utility dependency only if the project already uses one; prefer minimal additions.
- **Systems**: Browser WebSocket lifecycle, CORS or proxy considerations if the app calls Pacifica directly from the client (SvelteKit may use server-side proxy routes to avoid CORS or hide endpoints).
