## Context

The home route (`src/routes/+page.svelte`) renders `DUMMY_LIVE_SIGNALS` from `src/lib/live-signals/live-signals.ts`. The backend now exposes real signals at a JSON endpoint (example: [signals API](https://65d8-2400-8902-00-2000-2fff-fe43-b92.ngrok-free.app/signals)) with shape `data[]` containing `z_score`, `snr`, `token_long`, `token_short`, `symbol_a`, `symbol_b`, `alloc_a_pct`, `alloc_b_pct`, `datetime_signal_occurred`, plus `meta`.

The signal detail route expects slugs parsed as **long = token A**, **short = token B** (`parseSignalSlug`). The API orients long/short explicitly via `token_long` / `token_short`; allocations are tied to `symbol_a` / `symbol_b`, so mapping must align symbols before building the slug.

## Goals / Non-Goals

**Goals:**

- Load the home list from the signals API during SSR (or universal `load`) so first paint reflects real data when the service is reachable.
- Build slugs and row labels so **long** always appears as token A in the URL and UI, with **integer-rounded** allocations (0–100) for display and for `TOKEN_A:ALLOC-A-TOKEN_B:ALLOC-B`.
- Append **Z-score** and **SNR** to the row description with **≤ 2 decimal places** and **short** user-facing definitions.
- Make the API origin **configurable** (env-driven).

**Non-Goals:**

- Changing Pacifica chart behavior or replacing placeholder **entry price** / static copy on the signal **detail** page in this change (detail may still diverge from API until a follow-up).
- Authenticated or POST APIs; assume GET JSON unless the project already adds headers.

## Decisions

1. **Where to fetch** — Use `+page.server.ts` `load` (or `+page.ts` with public fetch) so the list is SSR-friendly and secrets can stay server-side if needed. Prefer **server** `load` if ngrok or similar requires special headers (e.g. `ngrok-skip-browser-warning`) that should not be duplicated in client bundles.

2. **Env var** — Introduce something like `PUBLIC_SIGNALS_API_URL` (full URL to `/signals`) or `PUBLIC_SIGNALS_API_BASE` + fixed path; **one** variable is enough if it includes path. Document in `.env.example`.

3. **Mapping long/short → slug** — Set `longToken = token_long`, `shortToken = token_short`. If `symbol_a === longToken`, use `allocLong = round(alloc_a_pct)`, `allocShort = round(alloc_b_pct)`; else swap. Build slug as `${longToken}:${allocLong}-${shortToken}:${allocShort}`. Validate parser compatibility (alphanumeric tokens per existing rules).

4. **Rounding** — Use `Math.round` for allocations for consistency with “integer percentages” in existing specs. If rounded pair does not sum to 100, **still acceptable** for this change (detail chart uses slug ints); optional follow-up to normalize.

5. **Z-score / SNR copy** — Centralize a small string template or helper, e.g. “Z-score **-2.67** (spread vs its typical range). SNR **13.11** (signal strength vs noise).” Keep under one or two lines with `line-clamp` if needed.

6. **ngrok-free** — If server fetch gets 403/HTML interstitial, send `ngrok-skip-browser-warning: true` (or documented header) from server `load` only.

## Risks / Trade-offs

- **[Risk] API down or CORS** — Server-side fetch avoids browser CORS for same-origin page load; failures surface as error UI. **Mitigation:** try/catch, user-visible message, optional retry later.
- **[Risk] Token symbols not valid for `parseSignalSlug`** — e.g. non-alphanumeric. **Mitigation:** filter or skip bad rows with a logged warning; do not link broken slugs.
- **[Risk] Rounded slug ≠ exact API weights** — chart weighting uses integers from URL. **Mitigation:** documented non-goal; values remain best-effort match.

## Migration Plan

1. Add env configuration and server fetch helper.
2. Switch `+page` data from dummy import to `data` from `load`.
3. Remove or gate dummy data to Storybook/tests only if still useful.
4. Deploy with env pointing to production signals URL; rollback by reverting env or deploy previous build.

## Open Questions

- Whether `meta.generated_at` should be shown in the UI in addition to per-row `datetime_signal_occurred` (proposal focuses on row time).
- Whether duplicate pairs in API should be deduplicated by slug (default: show API order as-is).
