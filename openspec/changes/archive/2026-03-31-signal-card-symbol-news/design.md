## Context

Live signals render as linked cards on `/` (`+page.svelte`) with data from `PUBLIC_SIGNALS_API_URL` via `+page.server.ts`. There is no dedicated Shadcn dialog package in the repo today; overlays should be implemented with semantic HTML (`<dialog>`) or a small local Svelte component with focus management, consistent with Tailwind and the oceanic design tokens already used on list rows.

The news provider returns JSON like `{ data: [{ symbol, last_updated, elfa: { success, data: [{ summary, sourceLinks, ... }] } }] }` (see [news API](https://65d8-2400-8902-00-2000-2fff-fe43-b92.ngrok-free.app/news)). Summaries are multi-sentence strings; the product asks for a **single-sentence** teaser on the card and **all** summary entries in an overlay for the two legs only.

## Goals / Non-Goals

**Goals:**

- One configurable news list URL (e.g. `PUBLIC_NEWS_API_URL`), mirroring the signals pattern and reusing the same ngrok bypass header behavior as `fetch-signals.server.ts` where applicable.
- Server-side fetch of the full news payload once per home page load (or batched), then client-side lookup by symbol so list rendering stays simple and avoids N+1 HTTP calls.
- Card UI: per leg, show **one** condensed line (first sentence or trimmed text with ellipsis) when news exists; clear “no news” or omit line when missing.
- Overlay: show **every** `elfa.data[].summary` for **both** `token_long` and `token_short` symbols, grouped by symbol, with `sourceLinks` as outbound links; close via button, backdrop click, and Escape; trap focus while open.
- Visual parity with `.cursor/rules/design-system-ui-ux.mdc` (24px card radius on panel, glass blur, teal borders, secondary pill button).

**Non-Goals:**

- News on archives list, signal detail page, or pairs page (unless explicitly extended later).
- Polling or real-time news updates on the list.
- Summarization or LLM compression in the client beyond deterministic text shortening (first sentence / character cap).

## Decisions

1. **Fetch in `+page.server.ts`**  
   **Rationale**: Keeps secrets/env on server, matches signals list; single response cached per request. **Alternative**: client-only fetch — rejected to avoid CORS and duplicate env exposure patterns.

2. **Symbol matching: case-insensitive**  
   **Rationale**: API uses `AAVE`, UI tokens may differ in casing. Build a `Map` keyed by uppercased symbol. **Alternative**: strict equality — brittle.

3. **Teaser text: first sentence heuristic**  
   **Rationale**: Spec asks for “one sentence”; split on `. ` with fallback to max length (~120–160 chars) + ellipsis. **Alternative**: always full first summary — too long for card.

4. **Overlay: `<dialog>` + `showModal()`**  
   **Rationale**: Built-in backdrop, Escape handling, and accessibility hooks without new dependencies. Style with `rounded-[24px]`, `backdrop:bg`, `bg-white/90`, `backdrop-blur-md`. **Alternative**: bits-ui / shadcn-svelte — not present; adding a full library is out of scope for this change.

5. **Interaction model: button stops navigation**  
   **Rationale**: The row is an `<a>`; the “All news” control MUST use `onclick` with `preventDefault` / `stopPropagation` (or be outside the anchor — preferred: restructure row to a card with an inner link for the main hit target and a separate button for news). **Decision**: Prefer **splitting** the row into a non-link wrapper with a primary “Open signal” control and secondary “News” button to avoid nested interactive elements and invalid HTML.

6. **Failure handling**  
   **Rationale**: If news URL unset, show no news block (same as “not configured” for optional feature). If fetch fails, show nothing or a single muted “News unavailable” on the list header—not per row—to avoid noise. **Alternative**: per-row error — too busy.

## Risks / Trade-offs

- **[Risk] Large news JSON slows TTFB** → **Mitigation**: Single request; document env optional; consider future pagination server-side.
- **[Risk] First-sentence split breaks on “Dr.” / decimals** → **Mitigation**: Simple split acceptable for v1; optional regex later.
- **[Risk] Row refactor breaks full-card link** → **Mitigation**: Keep large clickable area via link covering most of card except explicit buttons (or use two-column layout with clear primary action).

## Migration Plan

1. Add `PUBLIC_NEWS_API_URL` to `.env.example` and deployment docs (if present).
2. Ship UI behind “news loaded” — if env missing, behavior matches today.
3. Rollback: remove env and news UI blocks; no data migration.

## Open Questions

- Whether archived signals should reuse the same overlay component later (out of scope; component can live under `$lib` for reuse).
- Exact max length for teaser if first sentence exceeds one line on small screens (CSS `line-clamp-2` as optional cap).
