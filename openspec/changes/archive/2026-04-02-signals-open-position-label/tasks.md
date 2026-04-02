## 1. Reactive active slugs

- [x] 1.1 Add a small client module (e.g. under `src/lib/signal/` or `src/lib/live-signals/`) that exposes a **reactive `Set` or derived predicate** for “slug is in `castor:activePairPositions`”, built from `readActivePairPositions()` / `isSlugActive`, and subscribes to **`window` `storage`** (key `castor:activePairPositions`) so updates from other tabs refresh the set.
- [x] 1.2 Ensure same-tab updates are reflected when the user returns to `/` after open/close (e.g. re-read on `onMount`, focus, or a lightweight invalidation hook used by rows—align with existing app patterns).

## 2. Live signal row UI

- [x] 2.1 In `src/lib/live-signals/live-signal-row.svelte`, when the reactive helper reports the row’s **`signal.slug`** as active, render a **pill badge** with **icon + short label**, using Tailwind consistent with design-system-ui-ux (pill radius, `#B9E9F6` / `#22C1EE` border or tint, `#144955` or `#527E88` text, no heavy black shadow).
- [x] 2.2 Place the badge in the card header/meta area so it stays visible on mobile (flex-wrap acceptable); verify it does not break long/short leg layout or news teaser.
- [x] 2.3 Guard **SSR**: no `localStorage` access during server render; badge appears only after client knows storage state (no crash, acceptable default hidden until hydrated).

## 3. Verification

- [x] 3.1 Manually verify: slug in storage shows pill; remove slug shows no pill; two tabs: change storage in one tab, list updates in the other when applicable.
- [x] 3.2 Quick pass on narrow viewport for overflow and tap targets on the row (row remains navigable; badge does not steal primary action).
