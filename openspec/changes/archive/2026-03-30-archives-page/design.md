## Context

`/archives` is a stub. Live signals on `/` use `+page.server.ts`, `PUBLIC_SIGNALS_API_URL`, `fetchSignalsList`, and `mapSignalsApiRows` to render cards that link to `/signal/[slug]`. The archives backend returns JSON shaped like live signals with extra fields: `z_score_end`, `snr_end`, `datetime_signal_archived`, plus `z_score_start` / `snr_start` and `datetime_signal_occurred` (sample response confirmed).

## Goals / Non-Goals

**Goals:**

- Server-side load of archives list (SSR-friendly, same pattern as home).
- Visual parity with home list: long/short badges, 24px cards, teal shadow, hover scale, typography colors from design system.
- Show **archived at** explicitly; metrics line uses **end** z-score and SNR with ≤2 decimals and short explanations (reuse or mirror `buildSignalMetricsDescription` with `z_score_end` / `snr_end`).
- Slug and allocation rules identical to live list (`token_long` / `token_short`, rounded percents, omit non-parseable rows).
- Ngrok and similar tunnels: server `fetch` may need `ngrok-skip-browser-warning: 1` when calling user-provided hosts (optional enhancement in shared fetch helper).

**Non-Goals:**

- Changing signal detail page behavior for archived vs live.
- Pagination or infinite scroll (unless API adds it later).
- Writing to the archives API.

## Decisions

1. **Env var**: Introduce `PUBLIC_ARCHIVES_API_URL` (full URL including `/archives` path), parallel to signals URL. Rationale: different deployment/base URLs; keeps secrets and tunnel URLs out of code.

2. **Mapping layer**: Add `$lib/archived-signals/` (or extend live-signals with shared types) with `ArchivesApiRow` interface, `fetchArchivesList` mirroring `fetchSignalsList`, and mapper producing a view model like `LiveSignal` plus `archivedAt: string` and description from end metrics. Rationale: avoids coupling home page types to archive-only fields; keeps one place for validation/slug rules.

3. **UI reuse**: Implement archives `+page.svelte` by copying the home list structure (or extracting a small shared presentational component later). For this change, **prefer duplication over premature abstraction** unless an existing shared list component exists—tasks can note extract-if-duplicated.

4. **Occurred vs archived time**: Show **signal occurred** (same label as home: “Generated …”) and a second line or label for **Archived** using `datetime_signal_archived`. Rationale: matches user request and API.

5. **API errors**: Same UX as home: not configured message, loading via `navigating` or server pending state, error banner, empty state.

## Risks / Trade-offs

- **[Risk]** Ngrok free tier interstitial blocks server fetch → **[Mitigation]** Send skip-browser-warning header from server fetch when URL host matches known pattern or always for configured URL (document in code comment).
- **[Risk]** API field names drift from sample → **[Mitigation]** TypeScript interface + runtime checks consistent with `fetchSignalsList` pattern; fail gracefully with error state.
- **[Trade-off]** Duplicated list markup vs shared component—acceptable for first ship; refactor in a follow-up if both pages keep changing together.

## Migration Plan

1. Add env var to documentation / example env.
2. Ship code; existing users without var see “not configured” on archives (consistent with signals).
3. Rollback: revert route and lib; stub page optional.

## Open Questions

- Whether detail charts for archived slugs need different data (out of scope; assume same as live).
