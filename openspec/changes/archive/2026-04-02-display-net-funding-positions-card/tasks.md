## 1. Data model and normalization

- [x] 1.1 Extend `NormalizedLegPosition` in `src/lib/positions/pacifica-position-normalize.ts` with a numeric **funding paid** field parsed from Pacifica `funding` (non-finite or empty → `0`); keep existing validation behavior for qty/entry.
- [x] 1.2 Add **net funding paid** (USD number) to `OpenPosition` in `src/lib/positions/open-position.ts`.
- [x] 1.3 In `src/lib/positions/build-open-position-row.ts`, set net funding to **leg A funding + leg B funding** when building `OpenPosition` from `MergedPairPositionRow`.

## 2. Positions list UI

- [x] 2.1 In `src/lib/components/position-list-item.svelte`, render a **“Net funding paid”** (or equivalent) line **directly below** the unrealized P&L block, using **smaller** typography than the P&L line and secondary/meta styling per the design system.
- [x] 2.2 Format the value with **signed USD** (or the same conventions as P&L dollar formatting) so sign is clear without relying on color alone.

## 3. Verification

- [x] 3.1 Manually verify `/positions` with an open pair: net funding matches the sum of both legs’ `funding` from the Get positions response (via network tab or debugger).
- [x] 3.2 Run project checks (`bun run check` or equivalent) and fix any new type or lint issues.
