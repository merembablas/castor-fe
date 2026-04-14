## Context

The archives route (`/archives`) loads the full archives API payload on the server, maps rows to `ArchivedSignal`, and renders every row in `+page.svelte`. Dedupe today uses `archivedAt` per slug (`mapArchivesApiRows`). There is no pagination or explicit global sort beyond dedupe behavior.

## Goals / Non-Goals

**Goals:**

- Show **five** archived signals **per page**, with a clear way to view older pages.
- Order signals by **ended time** in **descending** order. **Ended time** is the instant the signal stopped being active as shown in the UI today: **`datetime_signal_archived` → `archivedAt`** (not “signal occurred”).
- Keep list UX consistent with existing oceans-themed cards and accessibility (focus, labels).
- Encode the current page in the URL (e.g. query parameter) so refreshes and shared links preserve position where possible.

**Non-Goals:**

- Changing archives API contracts or adding backend pagination unless the project later adopts a paged API (this design assumes **full fetch + slice in the app** unless the codebase already exposes offset/limit).
- Changing slug rules, row content, or signal detail behavior.

## Decisions

1. **Where to sort and paginate**  
   **Decision:** After `mapArchivesApiRows` (and any dedupe), **sort the full list** by `archivedAt` descending, then **slice** for the requested page in the **server load** so the first paint matches SSR HTML.  
   **Rationale:** Single source of truth, no hydration mismatch, works with today’s single-request model.  
   **Alternative:** Client-only pagination of the full array — rejected for larger payloads and duplicate logic; still acceptable as a fallback if load is moved client-side later.

2. **Page selection in the URL**  
   **Decision:** Use a query parameter (e.g. `page` or `p`), **1-based**, default **1** when missing or invalid.  
   **Rationale:** Bookmarkable; SvelteKit `load` can read `url.searchParams`.  
   **Alternative:** Path segment `/archives/page/2` — more routing churn for one list.

3. **Page size**  
   **Decision:** **Fixed constant** `5` in one module or next to the load function (no user-configurable page size in v1).  
   **Rationale:** Matches the product ask and keeps UI simple.

4. **Pagination UI**  
   **Decision:** **Previous / Next** (and optionally compact “Page *x* of *y*” or first/last if space allows). Use existing button/link patterns and **disabled** state at boundaries; ensure **touch-friendly** hit targets on small viewports.  
   **Rationale:** Minimal scope; sufficient for low page counts.  
   **Alternative:** Numbered page links for every page — optional enhancement if many pages.

5. **Empty and error states**  
   **Decision:** Pagination controls **hidden** when `archivesEmpty`, misconfigured, or error; only show when there is more than one page of results.

## Risks / Trade-offs

- **[Risk] Fetching the full archive on every visit may get slow** as data grows → **Mitigation:** Document that server-side API pagination would be a follow-up; keep mapping/sort in one place to swap in API offset/limit later.
- **[Risk] `page` query points past the last page** (e.g. old bookmark) → **Mitigation:** Clamp to valid range or redirect to last page and show the slice for that page.
- **Trade-off:** Sorting after dedupe defines a single global order; duplicates removed by slug still follow “newest `archivedAt` per slug” before the global sort.

## Migration Plan

- Deploy as a normal frontend release; no data migration.
- **Rollback:** Revert the route and helpers; no persisted state depends on this.

## Open Questions

- None blocking: confirm with product that “ended time” is **archive time** (`archivedAt`) rather than “signal occurred” (`generatedAt`).
