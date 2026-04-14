## 1. Data ordering and paging in the load function

- [x] 1.1 Extend `src/routes/archives/+page.server.ts` (or a small helper it imports) to read the current **page** from the request URL (1-based; default 1; reject or clamp invalid values per design).
- [x] 1.2 After `mapArchivesApiRows`, **sort** the full `ArchivedSignal[]` by `archivedAt` **descending** if not already guaranteed by that pipeline.
- [x] 1.3 Compute **total page count** from list length and a **page size constant of 5**; slice the array for the current page; pass **page signals**, **page index**, **total pages**, and any flags needed for empty/error/configured states to the page.

## 2. Archives page UI

- [x] 2.1 Update `src/routes/archives/+page.svelte` to render only the **paged** slice from load data; keep existing row markup and loading/error/empty behaviors.
- [x] 2.2 Add **pagination controls** (e.g. Previous/Next, optional "Page *x* of *y*") using existing styling patterns; hide when not applicable; ensure **disabled** boundaries and **touch-friendly** targets on small screens.
- [x] 2.3 Wire controls to **navigate with query params** (preserve `/archives` path) so URL reflects the current page.

## 3. Types and verification

- [x] 3.1 Update `PageData` / props types for new fields (`+page.ts` or generated types after edits).
- [x] 3.2 Manually verify: more than **5** archived items show five per page, order **newest archived first**, page URL updates, reload keeps page, empty/error states show **no** pagination.
