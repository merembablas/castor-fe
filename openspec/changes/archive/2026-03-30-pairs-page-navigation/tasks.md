## 1. Pairs data layer (server)

- [x] 1.1 Add `$lib/server/pairs-cache.ts` (or equivalent) with a **900s TTL** in-memory cache: `getPairsPayload()` fetches `${PAIRS_API_BASE_URL}/pairs` when stale/miss, parses JSON, stores `{ payload, fetchedAt }`, returns typed result or throws/returns error shape for `load`.
- [x] 1.2 Define TypeScript **interfaces** for API rows (`symbol_a`, `symbol_b`, `coint_coefficient`, `adf_statistic`, `adf_p_value`, `zero_crossings`, `mean_crossing_time`, `market_a`/`market_b` with `funding`, `next_funding`, `updated_at`, `categories`, plus top-level `meta`) in e.g. `$lib/pairs/types.ts`.
- [x] 1.3 Implement **allocation helpers**: `pct_a = (100 * abs(β)) / (abs(β) + 1)`, `pct_b = 100 / (abs(β) + 1)` with display rounding and sum correction per `design.md`.
- [x] 1.4 Document **`PAIRS_API_BASE_URL`** in `.env.example` (create or append) with the ngrok sample URL **without** trailing slash.

## 2. `/pairs` route UI

- [x] 2.1 Add `src/routes/pairs/+page.server.ts`: call cache helper; on success pass `{ pairs, pairsError?, pairsConfigured? }`; on missing env, return a clear **not configured** message (mirror live-signals pattern if applicable).
- [x] 2.2 Add `src/routes/pairs/+page.svelte`: `<svelte:head>` title/description, `max-w-3xl` layout, loading via `navigating` or parent pattern, **empty**, **error**, and **list** states.
- [x] 2.3 For each pair card (`rounded-[24px]`, teal glow, design-system colors): show **long `symbol_a` / short `symbol_b`** with **allocation %**; **categories** per leg; **ADF** stat + **p-value**, **zero crossings**, **mean crossing time**; **last updated** = max of leg `updated_at` (fallback `meta.generated_at`); **current/next funding** for both legs; format numbers and dates consistently with the home page.
- [x] 2.4 Ensure **no horizontal overflow** on small viewports (stack stats/funding blocks as needed).

## 3. App navigation drawer

- [x] 3.1 Refactor `src/lib/components/app-header.svelte`: remove inline **pill `<nav>`**; add **hamburger** `button` with `aria-expanded`, `aria-controls`, and accessible label; implement **drawer panel** + **backdrop** (glass-friendly overlay, `backdrop-blur`), **Escape** to close, **focus** into drawer on open and **return focus** to button on close, optional **scroll lock** while open.
- [x] 3.2 Move link definitions into a single structure including **`/pairs`** (`resolve()` from `$app/paths`); render links in the drawer with **active-route** styling matching prior pill behavior; **navigate + close** on link activation.
- [x] 3.3 Keep **Solana wallet** block unchanged in layout relative to the new menu control; verify **touch targets** ≥ ~44px and keyboard **Tab** order through drawer links.

## 4. Verification

- [x] 4.1 Run `bun run check` (or project equivalent) and fix any new type or Svelte issues.
- [x] 4.2 Manually verify: open/close drawer, all four routes including **`/pairs`**, active states, cache behavior (two rapid refreshes / server logs if available), and error UI with a bad base URL.
