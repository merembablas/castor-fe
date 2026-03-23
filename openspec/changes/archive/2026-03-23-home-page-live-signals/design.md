## Context

The app already implements signal detail at `/signal/[slug]` with a strict slug pattern (`TOKEN_A:ALLOC-TOKEN_B:ALLOC`). The root layout is minimal (favicon + global CSS); `+page.svelte` is still the SvelteKit default welcome screen. This change introduces the primary shell (header + nav) and replaces the home page with a live signal feed backed by dummy data until a real API exists.

## Goals / Non-Goals

**Goals:**

- Ship a **consistent app chrome**: header with three nav targets—**Live signals** (`/`), **Positions** (`/positions`), **Archives** (`/archives`).
- Render **exactly three** dummy signals on the home list, each row linking to a **valid** detail slug so existing `signal/[slug]` behavior stays authoritative.
- Visually distinguish **long (token A)** vs **short (token B)** using **different icons or badges** and **distinct color accents** (still within the oceanic palette: e.g. teal/cyan for long, deeper teal or muted contrast for short).
- Show **allocation percentages**, **generated timestamp** (locale-formatted or ISO-derived display), and a **single-line description** per row.
- Keep the list and header **responsive**: tappable rows, no horizontal overflow on small viewports.

**Non-Goals:**

- Real-time updates, pagination, filters, or API integration.
- Full Positions or Archives product flows—only **stub pages** (short copy or empty state) so nav targets resolve without 404 confusion.
- Changing signal-detail requirements or slug parsing rules.

## Decisions

1. **Data source for the list** — Use a **typed in-module array** (or `$lib` module) of `LiveSignal` objects: `slug`, `tokenALabel`, `tokenBLabel`, `allocationA`, `allocationB`, `generatedAt` (`Date` or ISO string), `description`. Rationale: zero backend dependency; trivial to swap for `load()` + fetch later.

2. **Slug alignment** — Dummy slugs **must** match the existing parser (e.g. `ETH:25-SOL:75`). Rationale: avoids invalid detail URLs and keeps one source of truth in `signal-detail` spec.

3. **Navigation implementation** — Use SvelteKit **`$app/state`** (or `page.url.pathname`) to mark the **active** nav item; use plain `<a href="...">` for progressive enhancement. Rationale: SSR-friendly, no client-only router hacks.

4. **Layout placement** — Extend **root** `+layout.svelte` with the header so all top-level routes share chrome. Rationale: Positions/Archives stubs inherit the same nav without duplication.

5. **Long vs short presentation** — **Token A = long**, **token B = short** (consistent with pair-trading language). Use paired UI chips: e.g. upward-trend or “L” badge + lighter teal for long; downward or “S” badge + deeper `#144955` / `#527E88` accent for short. Rationale: meets “icons and color” differentiation without new asset pipeline; optional Lucide icons if already in project.

6. **Stub routes** — Add minimal `src/routes/positions/+page.svelte` and `src/routes/archives/+page.svelte` with heading + “Coming soon” (or equivalent). Rationale: satisfies nav links today; user can replace later.

7. **Design system** — Follow `.cursor/rules/design-system-ui-ux.mdc` literally for this change: **glassmorphism** on the persistent header (`backdrop-filter` ~12px, `rgba(255, 255, 255, 0.4)`); **24px** radius on list cards, **pill** radius on nav/chips; **soft teal glow** shadows (`0 10px 30px -10px rgba(34, 193, 238, 0.2)`); typography **`#144955` / `#527E88`**; primary buttons **`#22C1EE`** with white text, secondary ghost / **`#B9E9F6`**; **Tailwind-first**; **~1.02** hover on interactive elements.

## Risks / Trade-offs

- **[Risk] Dummy data drifts from API shape** → **Mitigation:** Define a single `interface LiveSignal` and keep field names aligned with expected backend DTOs.
- **[Risk] Active state wrong on nested paths** → **Mitigation:** Match pathname prefix: `/` only for exact home; `/positions` and `/archives` for their segments.
- **[Trade-off] Stub pages add route surface** → Acceptable; can be replaced wholesale when features ship.

## Migration Plan

Not applicable (greenfield UI). Deploy as normal static/SSR build; no data migration.

## Open Questions

- Whether **logo / product name** in the header is required in this iteration (can use text “Castor” or app title from existing branding if present).
