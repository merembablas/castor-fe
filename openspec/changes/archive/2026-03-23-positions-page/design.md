## Context

The app already ships a **glass header** with **Live signals**, **Positions**, and **Archives**; home (`/`) lists dummy live signals with long/short chips, allocations, and generated time (`src/routes/+page.svelte`). **`/positions` is linked but still a stub** (or empty). This design implements a real **open positions list** using the same card vocabulary and oceanic tokens, with dummy financial fields until an API exists.

## Goals / Non-Goals

**Goals:**

- Implement **`src/routes/positions/+page.svelte`** as a scannable list of **exactly three** dummy open positions.
- Mirror the **home signal row** structure: `rounded-[24px]`, `border-[#22C1EE]/20`, `bg-white/50`, teal glow shadow, `hover:scale-[1.02]`, typography **`#144955` / `#527E88`**, long/short **pill chips** with **up/down SVG icons** (reuse patterns from `+page.svelte`).
- Each row is a **horizontal layout**: main column (pair, times, P&L, size) + **Close position** as a **secondary** pill button on the **right** (align with flex `items-center` / `justify-between`; stack gracefully on very narrow screens).
- **Unrealized P&L** shown prominently as **percent** and **USD**; **profit** uses **green** (e.g. `text-emerald-600` or `#16a34a`—keep readable on white); **loss** uses **red** (e.g. `text-red-600` or `#dc2626`). At least one dummy row positive, at least one negative.
- **Datetimes**: **Generated** and **Opened** as separate labeled lines or compact labels, formatted with **`Intl.DateTimeFormat`** (same style as home `formatWhen`).
- **Size**: display notional as currency (e.g. **$5.00**) from a numeric field in the dummy model.

**Non-Goals:**

- Backend, WebSocket, or real close execution; **Close position** may be **inert** (button with `type="button"`) or log-only until API wiring.
- Pagination, filters, or position detail routes.
- Changing **live-signals** or **signal-detail** specs beyond what already guarantees `/positions` resolves.

## Decisions

1. **Data module** — Add **`$lib/positions/dummy-positions.ts`** (or `positions.ts`) exporting `DUMMY_POSITIONS: OpenPosition[]` and an `interface OpenPosition` with: `id`, `tokenALabel`, `tokenBLabel`, `allocationA`, `allocationB`, `generatedAt`, `openedAt` (ISO strings), `notionalUsd`, `unrealizedPnlUsd`, `unrealizedPnlPercent` (signed). Rationale: single source of truth; swap for `load` + fetch later.

2. **Row layout** — Use a **card container** (`<article>` or `<li>`) with **`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`**: left block = pair + meta + P&L + size; right = Close button **`shrink-0`**. Rationale: satisfies “button on the right” on desktop without crushing P&L on mobile.

3. **Long / short** — Reuse **home** chip classes and **arrow icons** (long ↑ teal chip, short ↓ deeper teal chip) so Positions and Live signals feel like one product.

4. **P&L presentation** — One **emphasis line** (e.g. semibold) combining **+1.2% · +$0.06** or **−0.8% · −$0.04** with color from sign of `unrealizedPnlUsd` (or percent if zero USD edge case). Rationale: “easy to see” per product ask.

5. **Close button** — **Secondary** ghost: `border border-[#22C1EE]/50`, `rounded-full`, hover scale; optional `aria-label` including pair symbols. Rationale: design-system secondary pattern; primary teal reserved for main CTAs.

6. **Optional component** — If `+page.svelte` exceeds ~120 lines, extract **`position-list-item.svelte`**; otherwise keep inline for speed.

## Risks / Trade-offs

- **[Risk] Color-only P&L** fails accessibility → **Mitigation:** Include **+ / −** prefix or arrows in the P&L string, not only hue.
- **[Risk] Dummy numbers feel arbitrary** → **Mitigation:** Document in code comment that values are placeholders; keep types ready for API.
- **[Trade-off] Rows are not links** → Acceptable; positions may not have detail URLs in v1.

## Migration Plan

Ship as a normal frontend deploy. No rollback data. If Close is wired later, feature-flag or API behind the same button.

## Open Questions

- Whether **Close** should open a **confirm** dialog in v1 (proposal: no—keep noop or `console` in dev only).
