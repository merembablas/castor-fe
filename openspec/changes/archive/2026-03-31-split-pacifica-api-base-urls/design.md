## Context

Today `PACIFICA_API_BASE_URL` (and `locals.pacificaApiBaseUrl`) drives every server-side Pacifica REST proxy plus SSR kline fetches in `src/routes/signal/[slug]/+page.server.ts`. The client uses `PUBLIC_PACIFICA_WS_URL` for candle WebSocket. Pacifica’s **test** REST host does not offer the same kline/history and candle WS surface as **production**, so teams want **test** for orders/account while keeping **production** for chart data.

## Goals / Non-Goals

**Goals:**

- Two independent server-configurable Pacifica **REST** origins: one for **trading and general REST proxies** (account, orders, leverage, prices, market-info), one for **kline / historical candles** only.
- Preserve a **sensible default** so existing single-URL deployments keep working (market-data REST falls back to the trading base URL when unset).
- Align `hooks.server.ts`, `app.d.ts`, Worker types, `wrangler.jsonc`, and `.env.example` with the new split.
- Pass the correct base into `fetchPacificaKlines` / kline `+server` and SSR load; leave non-kline `+server` routes on the trading base.

**Non-Goals:**

- Changing Pacifica auth header layout or signing (still one `PACIFICA_API_AUTHORIZATION` unless product later splits it).
- Client-side direct REST calls to Pacifica (app continues to use `/api/pacifica/*`); only server/chart pipeline picks market-data vs trading base.
- Renaming `PUBLIC_PACIFICA_WS_URL` unless implementation shows a naming clash; it already represents the candle feed and can stay the “market data WebSocket” with clearer docs.

## Decisions

1. **New env: `PACIFICA_MARKET_DATA_API_BASE_URL` (server-only)**  
   Used exclusively for kline fetches: `+page.server.ts`, `routes/api/pacifica/kline/+server.ts`, and `refetch-pacifica-kline-legs-client.ts` indirectly via `/api/pacifica/kline` (no client change if the API route reads the new local).  
   **Fallback:** if unset or empty, use `PACIFICA_API_BASE_URL` (current behavior).  
   **Rationale:** minimal surface area; avoids breaking Wrangler setups that only set one URL.

2. **Keep `PACIFICA_API_BASE_URL` as the “trading / general REST” origin**  
   All other `+server` handlers under `api/pacifica` keep using `locals.pacificaApiBaseUrl`.  
   **Rationale:** matches user mental model (“test API for positions”).

3. **WebSocket**  
   Continue using `PUBLIC_PACIFICA_WS_URL` with default `wss://ws.pacifica.fi/ws`. Document in `.env.example` that this URL should point at the environment that exposes the **candle** channel (typically production when test lacks it).  
   **Alternative considered:** `PUBLIC_PACIFICA_MARKET_DATA_WS_URL` — rejected to avoid duplicate public vars unless we later need two WS endpoints.

4. **Locals naming**  
   Add `pacificaMarketDataApiBaseUrl` (or similar) alongside `pacificaApiBaseUrl`, computed in `hooks.server.ts` with the fallback chain.  
   **Rationale:** explicit call sites for kline vs trade without overloading one field.

## Risks / Trade-offs

- **[Risk] Misconfigured market-data URL** → Kline SSR and chart refetch fail while trading works; **Mitigation:** clear `.env.example` comments and fallback to trading URL when market-data URL is unset.
- **[Risk] Auth differences between test and prod** → If Pacifica ever requires different headers per host, single `PACIFICA_API_AUTHORIZATION` may be insufficient; **Mitigation:** document as out of scope; operators use compatible keys per environment.
- **[Trade-off] Production klines + test orders** → Symbol/market parity between environments is assumed; **Mitigation:** product/docs note that slug symbols must exist on both or chart/trade may diverge.

## Migration Plan

1. Add new env and locals with fallback (no behavior change when var unset).
2. Point kline code paths at `pacificaMarketDataApiBaseUrl`.
3. Update `wrangler.jsonc` / deployment docs: optionally set `PACIFICA_MARKET_DATA_API_BASE_URL` to `https://api.pacifica.fi` while keeping `PACIFICA_API_BASE_URL` on test.
4. **Rollback:** remove the new var and revert kline call sites to `pacificaApiBaseUrl` only.

## Open Questions

- None blocking: exact Pacifica prod/test host strings stay in operator docs, not hard-coded beyond current defaults.
