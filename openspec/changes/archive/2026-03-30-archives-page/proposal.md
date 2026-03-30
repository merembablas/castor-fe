## Why

The **Archives** route exists in navigation but only shows a “coming soon” placeholder, so users cannot review past pair signals. The backend now exposes an **archives** HTTP API with the same pair semantics as live signals plus end-of-life metrics; wiring this up matches user expectations and completes the primary nav.

## What Changes

- Replace the `/archives` placeholder with a **server-loaded list** of archived pair signals, using the same card/list visual language as the home (live signals) page.
- Add configuration for the archives list URL (environment variable), parallel to `PUBLIC_SIGNALS_API_URL`.
- For each row, show **long/short pair**, **rounded allocations**, **signal occurred** time (or equivalent), **archived at** (`datetime_signal_archived`), and a metrics line using **z-score end** and **SNR end** (≤2 decimal places, brief explanations like home).
- Rows remain **navigable** to `/signal/[slug]` when the slug can be built from tokens and allocations (same rules as live list).
- Loading, empty, error, and “not configured” states consistent with the home signals experience.

## Capabilities

### New Capabilities

- `archived-signals`: Archives page fetches from the configured **archives** API; maps `data` rows to list items; displays `z_score_end`, `snr_end`, and `datetime_signal_archived` alongside pair and occurred time; design-system parity with live list (radius, typography, hover, long/short styling).

### Modified Capabilities

- `live-signals`: Update the **Archives** nav scenario so `/archives` is no longer described as placeholder-only—it SHALL show the archived-signals list per the new capability (positions behavior unchanged unless already specified elsewhere).

## Impact

- **Routes**: `src/routes/archives/+page.svelte`, new `+page.server.ts` (or equivalent load).
- **Config**: New public env var for archives API base URL (document in `.env.example` if present).
- **Lib**: Optional shared fetch/mapping alongside `live-signals` (reuse slug/allocation logic; extend or mirror API row types for `z_score_end`, `snr_end`, `datetime_signal_archived`).
- **External**: Default/example host `https://65d8-2400-8902-00-2000-2fff-fe43-b92.ngrok-free.app/archives` (ngrok may require skip-browser-warning header for server fetch).
