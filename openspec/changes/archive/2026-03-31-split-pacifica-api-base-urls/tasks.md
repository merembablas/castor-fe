## 1. Configuration and types

- [x] 1.1 Add `PACIFICA_MARKET_DATA_API_BASE_URL` to `worker-configuration.d.ts`, `.env.example` (with comments: prod kline vs test trading), and `wrangler.jsonc` as needed for Worker deploys
- [x] 1.2 Extend `src/app.d.ts` `Locals` with `pacificaMarketDataApiBaseUrl` (or the chosen name) documenting effective market-data REST origin
- [x] 1.3 In `src/hooks.server.ts`, read platform/env `PACIFICA_MARKET_DATA_API_BASE_URL`, trim, and set `pacificaMarketDataApiBaseUrl` to that value when non-empty, otherwise fall back to `pacificaApiBaseUrl`

## 2. Wire kline paths to market-data origin

- [x] 2.1 Update `src/routes/signal/[slug]/+page.server.ts` so `fetchPacificaKlines` uses `locals.pacificaMarketDataApiBaseUrl` (not the trading base)
- [x] 2.2 Update `src/routes/api/pacifica/kline/+server.ts` to pass `baseUrl: locals.pacificaMarketDataApiBaseUrl` into `fetchPacificaKlines`
- [x] 2.3 Confirm `refetch-pacifica-kline-legs-client.ts` only hits `/api/pacifica/kline` (no change) or adjust if any server path was missed

## 3. Docs and verification

- [x] 3.1 Update `src/lib/signal/pacifica/kline-fetch.ts` header comment (and any README/OpenSpec QA notes) to mention dual base URLs
- [x] 3.2 Manual check: with `PACIFICA_API_BASE_URL` on test and `PACIFICA_MARKET_DATA_API_BASE_URL` on prod, signal detail chart loads and live WS still work; batch order / leverage still hit test
