## Why

Traders need a **Pairs** view that surfaces cointegration candidates (symbols, stats, funding, categories) from the backend feed, and the header is already crowded with inline nav links. A **hamburger menu with a slide-out drawer** scales navigation as more sections are added (starting with Pairs) and keeps the bar usable on small screens.

## What Changes

- Replace (or complement) the current **horizontal nav pills** in the app header with a **hamburger control** that opens a **drawer** listing primary routes: Live signals, Positions, Archives, and **Pairs** (new). Drawer uses glassmorphism and design-system styling; links remain keyboard-focusable and the active route is visually indicated.
- Add a **`/pairs`** page that loads pair data from the external JSON API (`/pairs` on the configured base URL—see design for env/config), with **server-side caching for 15 minutes** to limit upstream load and speed repeat visits.
- Each **pair row/card** shows:
  - **Long and short symbols** with **allocation percent** per leg (derived from the API’s cointegration / hedge fields—exact mapping in design).
  - **Categories** for each symbol (from `market_a` / `market_b`).
  - **Stats**: **ADF** (statistic and/or p-value as agreed in spec), **zero crossings**, **mean crossing time**.
  - **Last updated** datetime (from market metadata `updated_at` or `meta.generated_at`—clarified in spec).
  - **Current funding** and **next funding** for both legs.
- Visuals follow **`.cursor/rules/design-system-ui-ux.mdc`** (oceanic palette, 24px cards / pill controls, soft teal glow, `#144955` / `#527E88` text).

## Capabilities

### New Capabilities

- `app-navigation`: Global **hamburger + drawer** navigation in the shell header; includes links to `/`, `/positions`, `/archives`, `/pairs`; accessible (focus trap or documented pattern, ESC to close), responsive, styled per design system.
- `trading-pairs`: **`/pairs`** route; **proxied or server-fetched** JSON from the pairs API with **15-minute cache**; typed models; list UI with the fields above; loading and error states; mobile-friendly list layout consistent with existing list pages.

### Modified Capabilities

- _(none)_ — no existing OpenSpec capability currently defines header navigation or pairs; this introduces both as new specs.

## Impact

- **`src/lib/components/app-header.svelte`** (and possibly a small **`nav-drawer.svelte`** or reuse of Shadcn **Sheet**): hamburger, drawer state, nav links.
- **`src/routes/pairs/+page.svelte`**, **`src/routes/pairs/+page.server.ts`** (or **`+server.ts`** proxy if the client must not call ngrok directly): load + cache.
- **Environment**: e.g. `PAIRS_API_BASE_URL` or reuse a generic backend base URL—document in `design.md` / `.env.example` if present.
- **Dependencies**: Prefer existing UI primitives (`$lib/components/ui`) for sheet/drawer if already installed; no new runtime deps unless the project already uses a drawer pattern elsewhere.
