## 1. Pacifica API plumbing

- [x] 1.1 Confirm Pacifica REST request/response shapes and auth for **update leverage**, **batch order**, and **market order** (docs + optional smoke against test env).
- [x] 1.2 Add typed client helpers (e.g. under `$lib/signal/pacifica/`) for update leverage and batch/market order submission, reusing `locals.pacificaApiBaseUrl` and authorization patterns from existing Pacifica proxies.
- [x] 1.3 Add SvelteKit API route(s) that proxy leverage and order calls server-side (or accept signed client payloads if required), returning structured success/error JSON to the browser.

## 2. Sizing and validation

- [x] 2.1 Implement **notional** math: `sizeUsd * leverage`, split by slug allocation A/B (percentages), matching the `SOL:20-ETH:80` / $10 / 10x → $20 long / $80 short example.
- [x] 2.2 Resolve **per-leg USD notional** to **base quantity** using current prices (reuse or add a small quote/mark fetch if not already available in the card).
- [x] 2.3 Integrate **cached market info** (lot, tick, min order size, max leverage) to round/clamp quantities; reject with a clear error when below **min order size** or otherwise invalid.

## 3. UI and wallet flow

- [x] 3.1 Replace `handleOpenPosition` placeholder in `signal-detail-card.svelte`: call the new API sequence (leverage ×2, then batch), with **loading** and **error** states on the CTA.
- [x] 3.2 Disable **Open position** when wallet disconnected, metadata missing, trade **in flight**, or slug already in active list; keep design-system styling for disabled state.
- [x] 3.3 Add concise copy for “already open” and execution errors (no raw stack traces).

## 4. Active positions storage

- [x] 4.1 Add a small module for **localStorage** read/write of active pair entries (`slug`, optional `openedAt`) under one app key.
- [x] 4.2 On mount, derive `isActiveForCurrentSlug` and wire to the CTA disabled state.
- [x] 4.3 On full successful execution only, append the current route slug to storage; ensure failed runs do not write.

## 5. Verification

- [x] 5.1 Manually verify happy path (wallet connected, valid size, both symbols) and failure paths (API error, size below minimum).
- [x] 5.2 Confirm reload keeps **Open position** disabled when slug remains in storage.
