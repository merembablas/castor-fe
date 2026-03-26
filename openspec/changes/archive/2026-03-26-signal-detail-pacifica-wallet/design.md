## Context

The signal detail route (`/signal/[slug]`) already resolves two tokens from the slug, loads weighted Pacifica klines on the server, and passes a WebSocket feed payload to `signal-detail-card.svelte`. Position size is preset pills plus custom USD; **Open position** is still a stub. Solana wallet connect exists elsewhere in the app; when connected, the UI can read a **public key** string suitable for Pacifica **account** REST calls.

Pacifica documents:

- [Get Market Info](https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/markets/get-market-info) — per-symbol constraints including max leverage, min lot, min ticks, min order size.
- [Get Account Info](https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/account/get-account-info) — balances, equity, margin used, etc.

## Goals / Non-Goals

**Goals:**

- Surface **effective max leverage** (min of both symbols’ max leverage from market metadata) and drive a **leverage combobox** in **5x** steps with the **less-than-5x max** rule (e.g. only `3x` when max is 3).
- **Cache market metadata ~24 hours** so most navigations do not refetch both symbols’ market info from origin.
- When **wallet is connected** and address is known, fetch and show **spendable balance** and **margin used vs. account equity** (percent) between **description** and **position size**.
- Reuse existing **`locals.pacificaApiBaseUrl`** (and optional **`pacificaApiAuthorization`**) patterns used for klines.

**Non-Goals:**

- Actually submitting open orders to Pacifica (CTA remains or evolves separately).
- Changing slug parsing, weighted chart math, or signals list enrichment.
- Wallet signature flows unless Pacifica account endpoint requires it (resolve during implementation per live API).

## Decisions

1. **Server-proxied REST (preferred)**  
   Add SvelteKit **`+server.ts`** routes under `src/routes/api/pacifica/` (mirroring `kline`) for **market info** and **account info**. The browser calls same-origin `/api/pacifica/...`; the handler forwards to Pacifica with `locals.pacificaApiBaseUrl` and optional auth header. **Rationale:** avoids CORS, keeps optional API keys on the server, matches existing kline proxy.

2. **Daily market cache**  
   Implement **~24h TTL** caching for **market info** responses keyed by **Pacifica symbol** (or raw token→symbol as today). **Options (choose one during implementation):**  
   - **Edge KV** (if deployed on Cloudflare Workers with KV binding) for cross-user reuse; or  
   - **In-memory + `Cache-Control`** on the API route for single-instance simplicity; or  
   - **Client `localStorage`** with timestamp (simplest on static adapter, weaker consistency).  
   **Rationale:** user asked to avoid refetch on every page open; exact store follows hosting constraints (`wrangler.jsonc` already suggests Workers).

3. **Where leverage state lives**  
   Keep **leverage** and **position USD** as **client state** in `signal-detail-card.svelte` (or a small `.svelte.ts` helper) with props for **effective max** and **market constraints** passed from load or from a client fetch after mount. **Rationale:** wallet is client-only; combobox is interactive.

4. **Account info fetch timing**  
   Fetch account when **wallet address** becomes available (`$effect` or wallet store subscription), call **`/api/pacifica/account?address=...`** (exact query name TBD to match Pacifica). Show **loading / error / empty** states without fabricating balances.

5. **Margin percentage**  
   Display **`total_margin_used / account_equity`** as a **percentage** (cap display at 100% if API allows above 100% edge cases), labeled so users understand **higher ≈ closer to liquidation stress** when equity is fully committed. **Rationale:** matches user’s ratio description.

6. **Leverage option list algorithm**  
   Let `M = floor(min(maxLevA, maxLevB))` or integer max from API. Build steps: `5, 10, …, M` while ≤ M. If `M < 5`, options = `[M]` only. If `M >= 5` but not a multiple of 5, include **M** as the final step if not already present (e.g. max 12 → 5, 10, 12 — user said "interval 5x" and max 20 → 5,10,15,20; for 12, **5, 10, 12** is reasonable). **Document in implementation:** final step is **min(M, largest 5k ≤ M)** or **M** if remainder — align with product: "steps of 5 up to max" implies include **M** when M not divisible by 5.

   Clarifying product rule: user said "interval 5x" and example 20 → 5,10,15,20. For M=12, use **5, 10, 12** (add max if not on grid). Spec will state: steps at 5x increments **not exceeding** effective max, **plus** effective max if not already included.

## Risks / Trade-offs

- **[Risk] Pacifica account API may require auth or different params** → Mitigation: read current Gitbook + probe in dev; gate UI behind “connect wallet” and show error string from API.
- **[Risk] Stale market cache after exchange parameter changes** → Mitigation: 24h TTL is acceptable per product; allow manual refresh later if needed (out of scope unless trivial).
- **[Risk] Symbol mapping mismatch** (`toPacificaSymbol` vs market info symbol)** → Mitigation: use same mapper as klines for both legs.
- **[Trade-off] Client-only cache vs server cache** → Server/KV improves multi-tab and freshness control; localStorage is simpler but per-browser.

## Migration Plan

1. Ship API routes + types; no DB migrations.
2. Deploy with env vars already used for Pacifica base URL (and auth if required).
3. Rollback: remove routes and UI blocks; no data migration.

## Open Questions

- Exact **request/response field names** for market and account endpoints (implement from Gitbook at apply time).
- Whether **account info** is **public-key-only** or needs **signed** headers.
