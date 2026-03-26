## 1. Pacifica REST proxies and types

- [x] 1.1 Confirm Pacifica **Get Market Info** and **Get Account Info** paths, query parameters, and response fields from Gitbook; add TypeScript interfaces in `$lib/signal/pacifica/` (or adjacent module).
- [x] 1.2 Add `src/routes/api/pacifica/market-info/+server.ts` (or per-symbol variant) that forwards to Pacifica using `locals.pacificaApiBaseUrl` and optional `locals.pacificaApiAuthorization`, matching the existing `kline` route pattern.
- [x] 1.3 Implement **~24h TTL** caching for market info per symbol (choose KV, `Cache-Control`, or documented client cache per `design.md` and hosting).
- [x] 1.4 Add `src/routes/api/pacifica/account/+server.ts` that accepts the wallet **public key** (query or POST body) and returns normalized account fields needed for UI (equity, total margin used, spendable balance per API mapping).

## 2. Leverage and market metadata helpers

- [x] 2.1 Implement `effectiveMaxLeverage(maxA, maxB)` and `buildLeverageOptions(effectiveMax)` per spec (5x steps, append max if not on grid, sub-5 max single option).
- [x] 2.2 Wire signal detail to resolve **both** Pacifica symbols via existing `toPacificaSymbol` and fetch **both** market metadata records (via load, combined endpoint, or client `fetch` to the new API route).

## 3. Signal detail UI and wallet

- [x] 3.1 Extend `signal-detail-card.svelte` layout: **description** → **account summary** (when `solanaWallet.connected` and `publicKey`) → **position size** + **leverage** (combobox/select from `$lib/components/ui`) → **Open position** CTA; match design system colors and mobile wrapping.
- [x] 3.2 Add client `$effect` or subscription to `solanaWallet` to call `/api/pacifica/account` when connected; implement **loading / error / empty** states without fake numbers.
- [x] 3.3 Bind leverage state (default to max allowed); disable or placeholder leverage control while market metadata is loading or missing; pass **min lot / tick / order size** into state or props for future order validation (display optional if not in MVP).

## 4. Verification

- [x] 4.1 Manually verify with a connected wallet on a valid slug: balance and margin percent render; leverage options match **min** of both symbols’ max; cache prevents excessive market requests across reloads within 24h.
- [x] 4.2 Run `npm run check` (or project lint/typecheck) and fix any new issues.
