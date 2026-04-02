## Context

The `/positions` list already loads **Pacifica Get positions** via `/api/pacifica/positions` and merges legs into `MergedPairPositionRow` (`legA` / `legB` as `NormalizedLegPosition`). `PacificaPositionRow` in `rest-types.ts` already includes `funding` (decimal string, “funding paid by this position since open” per [Pacifica docs](https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/account/get-positions)). That value is **not** copied into `NormalizedLegPosition` or `OpenPosition`, and `position-list-item.svelte` does not render it.

## Goals / Non-Goals

**Goals:**

- Surface **net funding paid** for each pair row as the **sum** of `funding` from the long leg’s position row and the short leg’s position row (same symbols as `legA` / `legB`), using the existing positions fetch (no new REST endpoint).
- Place the line **directly under** “Unrealized P&L” with **smaller** text than the P&L line (`text-base` today → use e.g. `text-xs` and secondary meta color `#527E88` aligned with design system).
- Reuse existing **signed USD** conventions where helpful (similar to `formatSignedUsd` for P&L dollars) so positive/negative is not color-only.

**Non-Goals:**

- Per-leg funding breakdown on the card (only the **net** for the pair unless a future change asks for it).
- Historical funding charts or funding rate schedules.
- Changing how unrealized P&L is computed.

## Decisions

1. **Aggregation**: **Net funding paid** = `parseFunding(legA) + parseFunding(legB)` where each term is `Number.parseFloat` on the REST `funding` string, with non-finite or missing treated as **0** (API shape includes `funding`; empty string falls back to 0). *Rationale*: Pair row is one product surface; users asked for net; avoids blocking the row if one field is malformed.

2. **Data path**: Extend **`NormalizedLegPosition`** with `fundingPaid: number` (or similar) populated in **`normalizePacificaPositionRow`**, then derive **`netFundingPaidUsd`** on **`OpenPosition`** when mapping `MergedPairPositionRow` → `OpenPosition` in `+page.svelte` (or a small helper next to existing mapping). *Rationale*: Keeps parsing in one place and avoids re-parsing in the component.

3. **Labeling**: Use copy such as **“Net funding paid”** (or **“Funding paid”**) next to the formatted value so the metric is identifiable without color. *Rationale*: Matches user language and Pacifica’s “funding paid” wording.

4. **Styling**: P&L remains `text-base font-semibold`; net funding line uses **`text-xs`** (or `text-sm` if `text-xs` is too faint) and **`text-[#527E88]`** for the label/value container, with optional green/red for sign consistent with P&L **if** we want parity—prefer **signed numeric** + secondary color first to avoid visual competition with P&L; optional light sign color can mirror P&L rules. *Rationale*: User asked for smaller than P&L; design system already defines secondary meta color.

**Alternatives considered:**

- **Sum only in the Svelte component from raw rows**: Rejected—duplicates parsing and bypasses the normalized model used everywhere else.
- **Separate API call**: Rejected—data already on Get positions.

## Risks / Trade-offs

- **Semantic sign of `funding`**: Pacifica documents “funding paid by this position”; we display the **algebraic sum** of both legs without inverting sides. If product later needs “net received” wording, copy can be adjusted. **Mitigation**: Use neutral label “Net funding paid” and signed USD.

- **Visual clutter**: Another line on an already dense card. **Mitigation**: Smaller type and meta color; single line only.

## Migration Plan

- Ship behind normal deploy; no storage or API version migration. Rollback: revert UI and model fields.

## Open Questions

- None blocking: confirm in QA that summed `funding` matches Pacifica’s expectation for the user’s mental model (paid vs received); adjust label if copy review prefers “Net funding” only.
