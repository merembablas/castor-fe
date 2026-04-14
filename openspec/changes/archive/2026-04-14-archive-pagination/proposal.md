## Why

The archives page currently renders every archived signal from the API in one list. As the archive grows, the page becomes long and slow to scan. Paginating the list (five signals per view) and ordering by most recently ended signals first makes browsing predictable and aligns the default view with what users care about most.

## What Changes

- Add **client- or server-side pagination** for the archives list so only **five** archived signals are shown per page (with controls to move between pages).
- **Sort** archived signals by **ended time** (the time the signal was archived / ended) in **descending** order (newest ended first) before pagination is applied.
- Preserve existing archived-signals behaviors: loading and error states, empty state, configuration messaging, row content, navigation to signal detail, and visual alignment with live signals.

## Capabilities

### New Capabilities

- _(none — behavior extends the existing archives listing.)_

### Modified Capabilities

- `archived-signals`: Require a fixed **page size of 5**, **sort by ended/archive time descending**, and **pagination** so users can access additional archived signals beyond the first page.

## Impact

- **Routes / data**: `src/routes/archives/` (`+page.server.ts` / `+page.ts` / `+page.svelte`) and any loaders or helpers that build `archivedSignals` for the archives route.
- **Mapping**: `src/lib/archived-signals/` (e.g. sorting and deduplication helpers) if sort order or slicing is centralized there.
- **Specs**: Delta under `openspec/changes/archive-pagination/specs/` for `archived-signals`.
- **Dependencies**: No new runtime dependencies expected; use existing SvelteKit patterns (e.g. URL search params for page) and existing UI primitives where possible.
