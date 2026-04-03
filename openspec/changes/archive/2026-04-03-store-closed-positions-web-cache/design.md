## Context

Open pair intent lives in `localStorage` under `castor:activePairPositions` as `{ slug, openedAt }` (`src/lib/signal/active-pair-positions.ts`). Rows on `/positions` reconcile that list with Pacifica **Get positions**; when both legs are closed (user flow or reconciliation), the slug is **removed** and no client record of the trade remains. The product wants a **durable client-side history** of closed pairs for fields aligned with the open row: symbols, allocations, open/close instants, realized P&L, and funding paid.

## Goals / Non-Goals

**Goals:**

- Persist each **closed** pair as an **append-only** (or idempotent append) historical record in **browser web cache** (`localStorage`, consistent with active pairs).
- Capture **pair identity** (same **slug** string as elsewhere), **long/short symbol names**, **allocation percentages** per leg, **opened** and **closed** timestamps, **realized P&L** (numeric + currency semantics matching existing P&L handling), and **funding paid** (single net scalar consistent with the sum of both legs’ Pacifica `funding` at close time, or last known before removal—see Decisions).
- Centralize **read/write/parse** in a small module next to `active-pair-positions.ts` (or sibling under `src/lib/signal/` / `src/lib/positions/`) with **safe parse**, **schema version**, and **`storage` event** compatibility if other tabs can close positions.

**Non-Goals:**

- Server-side persistence, sync across devices, or export UX (unless a later change).
- A full **history UI** on `/positions` (can be a follow-up; this change focuses on **storage contract** and **write hooks**).
- Backfilling history for trades closed before this feature ships.

## Decisions

1. **Storage medium**: Use **`localStorage`** with a dedicated key (e.g. `castor:historicalPairPositions`) holding a **JSON array** of records, mirroring the active-pair list pattern. **Rationale**: Same-origin, survives reload, matches existing Castor keys. **Alternative**: `IndexedDB`—rejected for first iteration (higher complexity) unless volume or size limits force it.

2. **Record identity**: Each entry includes a **`id`** (UUID string generated at write time) so the same slug can appear multiple times across closes. **Rationale**: Avoid collisions when a user re-opens and re-closes the same pair. **Alternative**: composite `slug + closedAt`—possible if UUID dependency is unwanted.

3. **Payload shape** (TypeScript interface, names illustrative): `id`, `slug`, `longSymbol`, `shortSymbol`, `longAllocationPercent`, `shortAllocationPercent`, `openedAt` (ms epoch), `closedAt` (ms epoch), `realizedPnlUsd` (number), `fundingPaidUsd` (number; net both legs), optional `schemaVersion` on the **wrapper** or per item for forward compatibility.

4. **When to write**: **Immediately before or after** removing the slug from `castor:activePairPositions`, only when the app has **enough data** to populate the record (Pacifica position snapshot + pair metadata). **Two call sites** to audit: **manual close success** and **reconciliation** that drops a slug because legs are no longer open—both should use one shared **“record closed position”** helper to avoid drift.

5. **P&L and funding source**: Prefer the **last Pacifica positions payload** (and mark/entry logic already used on the row) **at close** so realized P&L and funding match user-visible numbers. If the row is removed by reconciliation without a fresh fetch, use the **most recent in-memory row data** captured before prune; document any fallback in code comments.

6. **Retention**: Cap list length (e.g. **max 200** entries, drop oldest) to avoid `localStorage` quota errors. **Rationale**: Predictable size; product can raise cap or add pruning UI later.

## Risks / Trade-offs

- **[Risk] `localStorage` quota** → Mitigation: max-length cap; try/catch on `setItem` with user-visible toast or silent skip + log (product choice in implementation).
- **[Risk] Stale or missing snapshot on reconciliation** → Mitigation: shared helper requires minimum fields; skip write if symbols or times missing rather than writing garbage; optional dev-only warning.
- **[Risk] Multi-tab races** → Mitigation: read-modify-write pattern consistent with active pairs; rely on last-write-wins or merge-by-id if implementing re-read before write.
- **Trade-off**: History is **device-local** and **clearable**—users must not treat it as authoritative accounting.

## Migration Plan

- Ship storage module and writes **behind no flag** once tests/manual checks pass.
- **Rollback**: revert commits; existing users keep any written history key (harmless) or add one-time delete of `castor:historicalPairPositions` only if product requires (not default).

## Open Questions

- Whether **realized P&L** should also store **percent** for future UI parity with open rows (spec can ADD later).
- Exact **symbol strings** (Pacifica vs display) to store—must match how `/positions` resolves legs today.
