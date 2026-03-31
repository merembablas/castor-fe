## Why

Pacifica exposes historical klines and the candle WebSocket feed only on **production** infrastructure, while **test** (`test-api.pacifica.fi`) is needed for safe trading flows (open position, leverage, batch orders, account). Today a single `PACIFICA_API_BASE_URL` forces a trade-off: either charts break in dev/staging or trading cannot target test. Splitting configuration removes that conflict.

## What Changes

- Introduce a **separate base URL (and optional WS URL)** for **market data** (REST kline/history, candle WebSocket) vs **trading and account REST** (orders, leverage, account, prices, market info, and existing Pacifica proxies that are not kline-only).
- Wire **signal detail chart load** (`+page.server.ts`), **`/api/pacifica/kline`**, and **client chart refetch** to the market-data base; keep **trade execution** and **metadata/account** routes on the trading base.
- Update **SvelteKit locals**, **Cloudflare `wrangler` vars**, **`.env.example`**, **`worker-configuration.d.ts`**, and **app.d.ts** with new env names and sensible defaults (e.g. market-data defaults to production URLs when unset, trading defaults to current behavior).
- Document deployment expectations: trading can point at test; charts/WS point at production where those APIs exist.

## Capabilities

### New Capabilities

- None (requirements are updated via delta under existing `pacifica-weighted-candles`).

### Modified Capabilities

- `pacifica-weighted-candles`: Clarify that historical kline REST and candle WebSocket traffic SHALL use the **market data** Pacifica endpoints when the app is configured with distinct trade vs market-data origins; trading REST remains on the **trading** origin.

## Impact

- `src/hooks.server.ts`, `src/app.d.ts`, `worker-configuration.d.ts`, `wrangler.jsonc`, `.env.example`
- `src/routes/signal/[slug]/+page.server.ts`, `src/routes/api/pacifica/kline/+server.ts`, any code paths that fetch klines or open the candle WS
- Pacifica API routes that are **not** kline/chart-specific continue using the trading base URL
- Operators must set the new variables in each environment; missing vars should fall back in a predictable, documented way
