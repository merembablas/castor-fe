## 1. Types and storage module

- [x] 1.1 Add `HistoricalClosedPairPosition` interface (or equivalent) and a dedicated `localStorage` key constant (e.g. `castor:historicalPairPositions`), with `schemaVersion` on stored JSON if needed for forward compatibility.
- [x] 1.2 Implement `readHistoricalClosedPairPositions()`, safe parse, empty/invalid handling, and `appendHistoricalClosedPairPosition(record)` (or `append` accepting partial builder output) with **max-length** eviction (oldest first) per design.
- [x] 1.3 Ensure writes use try/catch (or project pattern) so quota errors do not break close/reconciliation flows.

## 2. Build record from row + metadata

- [x] 2.1 Add a single helper (e.g. `buildHistoricalRecordFromClosedPair`) that maps slug, long/short symbols, allocations, `openedAt` from `ActivePairPosition` / row state, `closedAt`, realized P&L USD, and net funding USD from the Pacifica-backed row data at close time; document fallbacks when a field is missing.
- [x] 2.2 Unit-test or lightweight test the parser, cap behavior, and append with valid/invalid JSON (follow existing project test conventions if any).

## 3. Wire into close and reconciliation paths

- [x] 3.1 On **successful dual-leg close** (where the slug is removed from `castor:activePairPositions`), call the append helper **before or after** removal per design, only when minimum fields are satisfied.
- [x] 3.2 On **reconciliation** that removes a slug from active storage, call the same append helper when sufficient data exists; skip without fabricating data otherwise.
- [x] 3.3 Manually verify: close a pair, confirm a new entry in devtools `localStorage`; corrupt the key and confirm the app still loads `/positions`.

## 4. Optional follow-up (out of scope unless product asks)

- [x] 4.1 _(Deferred)_ Surface historical list on `/positions` or a dedicated view—only if product requests after storage lands.
