## Why

Users lose visibility into **closed** pair trades once legs are no longer open on Pacifica and slugs are pruned from active storage. Persisting a **historical record** of closed positions locally (web cache) preserves pair symbols, allocations, open/close times, realized P&L, and funding paid for review without depending on backend history.

## What Changes

- Introduce **browser-side persistence** (web cache: e.g. `localStorage` or equivalent app pattern) for **closed pair positions** as **historical** entries.
- On **close** of a pair position (when both legs are closed or when the app reconciles storage away from an open state), **append** (or upsert per agreed identity rules) a historical record with:
  - **Pair symbols** (long/short legs) and **allocation** per leg (same semantics as active pair / positions UI).
  - **Opened datetime** and **closed datetime** (ISO or app-standard instant representation).
  - **P&L** at close (realized; format aligned with existing P&L display conventions).
  - **Funding paid** (net or per-leg as stored—documented in design/spec; consistent with how open rows aggregate leg `funding`).
- **No breaking change** to existing Pacifica or navigation contracts unless explicitly extended later (e.g. a history view).

## Capabilities

### New Capabilities

- `historical-positions`: Defines how the app **stores**, **indexes**, and **retains** closed pair positions in web cache (schema, keys, size/eviction if any, and when records are written).

### Modified Capabilities

- _(none for requirement-level changes until a product decision adds UI or API surface; storage-only can ship under `historical-positions`.)_

## Impact

- **Positions / pair lifecycle code**: hook when a position transitions to **closed** to build and persist a historical record (may overlap with reconciliation that removes slugs from `castor:activePairPositions`).
- **Shared types / storage helpers**: new module or extension next to existing active-pair storage patterns.
- **Privacy / device scope**: data stays on the client; clearing site data clears history unless export is added later.
