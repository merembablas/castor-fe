## 1. Configuration and Pacifica REST

- [x] 1.1 Add environment variables (and optional `app.d.ts` typing) for Pacifica REST base URL and any auth header the deployment requires.
- [x] 1.2 Implement a server-side kline fetch helper (e.g. `+server.ts` or shared `lib` module called from `load`) that requests `/api/v1/kline` with `symbol`, `interval` default `1h`, `start_time`, and optional `end_time`, parsing the documented JSON shape (`success`, `data[]` with `t,o,h,l,c`).
- [x] 1.3 Add integration tests or manual test notes for dual-symbol fetch and error handling (non-200, `success: false`).

## 2. Merge and weighted ratio math

- [x] 2.1 Implement symbol normalization from `SignalDetailViewModel` / slug tickers to Pacifica `symbol` strings.
- [x] 2.2 Implement alignment of two candle arrays by `t` and emit synthetic OHLC using \(X\_{\text{syn}} = X_A^{w_A} X_B^{w_B}\) with \(w_A = \text{allocationA}/100\), \(w_B = -\text{allocationB}/100\), skipping non-positive or invalid prices.
- [x] 2.3 Map merged output to existing `SignalCandlestickPoint` (or renamed type) expected by `signal-candlestick-chart.svelte`, including time scale compatibility (seconds vs ms) as required by lightweight-charts.

## 3. WebSocket realtime

- [x] 3.1 Implement Pacifica WebSocket client (browser or server proxy per design) that subscribes to `candle` for both symbols with `interval` `1h`.
- [x] 3.2 Merge incoming legs into the same keyed-by-`t` store and recompute synthetic bars; update the chart data structure incrementally.
- [x] 3.3 Add reconnect with bounded backoff and optional REST overlap window after reconnect to heal gaps.

## 4. Signal detail UI

- [x] 4.1 Wire signal detail route or layout `load` to pass initial merged candles into `signal-detail-card` / chart props.
- [x] 4.2 Add loading, error, and empty states for the chart region per updated `signal-detail` spec.
- [x] 4.3 Verify mobile layout: no horizontal overflow, readable axis labels, touch-friendly controls unchanged.

## 5. Verification

- [x] 5.1 Manually verify a slug such as `/signal/sol:30-eth:70` shows a chart that updates when WS messages arrive (staging).
- [x] 5.2 Cross-check exponent behavior: long leg positive exponent, short leg negative, values taken from slug integers divided by 100.
