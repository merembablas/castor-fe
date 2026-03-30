## Context

The app shell today exposes **Live signals**, **Positions**, and **Archives** as inline pill links in `app-header.svelte`. Adding **Pairs** would further squeeze the header—especially next to the Solana wallet controls on narrow viewports. Pair metadata will come from an external HTTP JSON API (currently exposed at a dev/ngrok base URL ending in `/pairs`).

Constraints: **Svelte 5 + SvelteKit**, **TypeScript strict**, **Tailwind**; no Shadcn/bits-ui packages are in `package.json` today, so the drawer is implemented with **semantic HTML**, **Tailwind**, and **minimal custom Svelte** (fixed panel + backdrop, `aria-*`, focus return to the menu button on close). Visuals MUST follow **`.cursor/rules/design-system-ui-ux.mdc`** (oceanic teal, 24px cards, glass header, soft glow).

## Goals / Non-Goals

**Goals:**

- **Hamburger + drawer** as the primary way to reach main app sections, including **`/pairs`**.
- **`/pairs`** page listing all items from `{ "data": [...], "meta": {...} }` with **15-minute server-side freshness** for upstream fetches (repeat loads within the window do not hit the origin again).
- **Typed** response parsing; **loading / empty / error** UX consistent with other list routes.
- **Configurable API base** via environment variable (avoid hardcoding ngrok in production builds).

**Non-Goals:**

- Editing pairs, trading from the list, or real-time WebSocket updates.
- Persisting pair data in a database or changing backend pair semantics.
- Adding new npm UI frameworks solely for the drawer.

## Decisions

1. **Drawer implementation**  
   - **Choice**: Custom **slide-in panel** from the start edge (LTR: left) with **scrim** (`backdrop-blur` + semi-transparent overlay), **body scroll lock** while open, **Escape** closes, **focus** moves to first focusable link on open and returns to the hamburger on close.  
   - **Alternatives**: Add `bits-ui` Sheet (rejected: new dependency for one pattern). Keep only horizontal nav (rejected: user explicitly wants hamburger for scalability).

2. **Where nav links live**  
   - **Choice**: Single source array in `app-header.svelte` (or tiny `nav-links.ts`) including `{ path, label, match }` for `/`, `/positions`, `/archives`, `/pairs`, reused for the drawer only (inline header `<nav>` pills removed or hidden in favor of menu—**proposal**: remove horizontal pills on all breakpoints; wallet stays in header).  
   - **Alternatives**: Separate mobile/desktop layouts (rejected: one drawer simplifies behavior).

3. **Pairs data path**  
   - **Choice**: **`+page.server.ts` `load`** fetches **`${PAIRS_API_BASE_URL}/pairs`** (or single `PAIRS_API_URL` if easier) from the **server only** using `fetch` (credentials omitted). Parse JSON; pass typed array to the page.  
   - **Alternatives**: Client-side fetch to ngrok (rejected: CORS, exposes dev URL, worse caching story).

4. **15-minute cache**  
   - **Choice**: **In-memory module cache** in server-only code, e.g. `$lib/server/pairs-cache.ts`, storing `{ payload, fetchedAt }` with TTL **900_000 ms**; on `load`, if `Date.now() - fetchedAt < TTL`, return cached payload; else refetch and replace. Document that **serverless multi-instance** deployments may cache separately per isolate (acceptable for hackathon / dev).  
   - **Alternatives**: `Cache-Control` on the HTML response only (does not dedupe upstream by itself); Cloudflare KV (rejected: extra infra).

5. **Long / short labels and allocation %**  
   - **Choice**: Display **`symbol_a` as long** and **`symbol_b` as short** (fixed convention unless the API later adds explicit side). **Allocation** = dollar-neutral hedge weights from **`coint_coefficient`** β:  
     - `pct_a = (100 * |β|) / (|β| + 1)`  
     - `pct_b = 100 / (|β| + 1)`  
     Rounded for display (e.g. one decimal), and **must sum to ~100%** after rounding (adjust one leg if needed).  
   - **Alternatives**: Raw β only (rejected: user asked for percent); infer long/short from sign of `coint_premium` (deferred—can be OPEN if product disagrees).

6. **“Last updated” datetime**  
   - **Choice**: Show a single **“Last updated”** using the **maximum** of `market_a.updated_at` and `market_b.updated_at` (ISO strings), formatted with `Intl.DateTimeFormat` like other pages. If parsing fails, fall back to `meta.generated_at` when present.

7. **ADF display**  
   - **Choice**: Show **ADF statistic** (`adf_statistic`) and **p-value** (`adf_p_value`) in the stats row (user said “adf”; both are useful and in the payload).

8. **Environment variables**  
   - **Choice**: e.g. `PAIRS_API_BASE_URL` = `https://....ngrok-free.app` **without** trailing slash; server builds URL as `` `${base.replace(/\/$/, '')}/pairs` ``. Document in `.env.example` if the repo uses one.

## Risks / Trade-offs

- **[Risk]** In-memory cache is **per runtime instance** → inconsistent freshness across Cloudflare workers. **Mitigation**: Accept for now; switch to KV or `caches` API later if needed.  
- **[Risk]** Ngrok / dev URL **rotates** → devs must update env. **Mitigation**: Env-based config, clear README/.env.example note.  
- **[Risk]** Upstream returns **non-JSON** or **5xx**. **Mitigation**: Try/catch in `load`, surface friendly error on `/pairs` without breaking the shell.  
- **[Trade-off]** Long/short naming is **conventional** until the API specifies sides.

## Migration Plan

1. Ship drawer + `/pairs` behind no feature flag (single rollout).  
2. Set `PAIRS_API_BASE_URL` in deployment env.  
3. **Rollback**: Revert header to previous commit and remove `/pairs` route if critical (no data migration).

## Open Questions

- Whether **`symbol_a` / `symbol_b`** long-short semantics should be swapped when **`coint_coefficient < 0`** (product confirmation).  
- Whether to show **`meta.generated_at`** alongside leg `updated_at` for transparency (optional small caption).
