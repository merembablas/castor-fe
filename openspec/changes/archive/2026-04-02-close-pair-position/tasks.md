## 1. Storage and types

- [x] 1.1 Add `removeActivePairPosition(slug: string)` (or equivalent) in `src/lib/signal/active-pair-positions.ts` that removes one slug from `castor:activePairPositions` without disturbing others.
- [x] 1.2 Audit the codebase for any other **slug-keyed** client persistence or in-memory caches tied to an open pair; clear or invalidate those on successful close (document if none beyond active-pair list).

## 2. Pacifica close client

- [x] 2.1 Add a browser module (e.g. `close-pair-position-client.ts` next to `execute-pair-trade-client.ts`) that accepts account, agent secret, symbol long/short, and **full close amounts** per leg from merged position data.
- [x] 2.2 Implement two agent-signed `create_market_order` POSTs via `/api/pacifica/orders/create-market` with **`reduce_only: true`** and sides that **flatten** long (A) and short (B) per `design.md`; reuse signing helpers from the open flow.
- [x] 2.3 Map Pacifica position size fields from existing merge/normalize types to order `amount` strings, reusing lot/tick constraints where the open path does.
- [x] 2.4 Throw or return structured errors on HTTP / exchange failure so the UI can show a message without claiming success.

## 3. Positions UI

- [x] 3.1 Extend `src/lib/components/position-list-item.svelte` with an `onClose` callback (or similar props): wire the **Close position** button, **disabled** + busy label while closing, preserve design-system secondary pill styling.
- [x] 3.2 In `src/routes/positions/+page.svelte`, implement the close handler: guard wallet + `pacificaAgentReady`, call close client with data from the row’s merged position, on full success call `removeActivePairPosition` and any extra slug cache cleanup from 1.2, then `refreshPositions()` (or equivalent) so the row disappears.
- [x] 3.3 On failure, set a visible error (row-level toast, inline alert, or page-level message—pick one consistent with existing patterns on the page).

## 4. Verification

- [x] 4.1 Manually test: open a small pair, confirm row on `/positions`, **Close position**, both legs flat on Pacifica, slug gone from localStorage and row removed.
- [x] 4.2 Manually test failure path (e.g. simulate API error if possible): slug remains, user sees error, no silent success.
