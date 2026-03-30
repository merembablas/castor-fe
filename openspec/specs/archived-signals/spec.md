## Requirements

### Requirement: Archives page lists archived pair signals from the archives API

The system SHALL display on `/archives` a list of archived signal entries loaded from the **archives** HTTP API. The absolute URL for the list request (including path, e.g. `.../archives`) SHALL be supplied via application configuration (environment variable). Each successful response SHALL yield zero or more list rows derived from the response `data` array. While the list request is in progress, the system SHALL show a loading state. When the request fails (network error, non-success HTTP status, or payload that cannot be interpreted as the expected shape), the system SHALL show an error state and SHALL NOT crash the page. When `data` is empty, the system SHALL show an appropriate empty state.

For each API item, the **long** leg in the UI SHALL correspond to `token_long` and the **short** leg to `token_short`. Allocation percentages used in the list and encoded in the detail URL SHALL be **whole integers** in the inclusive range 0–100, obtained by **rounding** `alloc_a_pct` and `alloc_b_pct` according to which of `symbol_a` / `symbol_b` matches the long and short tokens respectively.

Each entry SHALL be implemented as a control that navigates to `/signal/[slug]` where `slug` conforms to the pattern `TOKEN_A:ALLOCATION_A-TOKEN_B:ALLOCATION_B` with **TOKEN_A** the long token, **TOKEN_B** the short token, and **ALLOCATION_A** / **ALLOCATION_B** the rounded integer allocations for those legs. Rows whose tokens would not satisfy the signal detail slug parser SHALL be omitted or otherwise not presented as navigable archived signals.

Each row SHALL show token A and token B with their allocation percentages, a datetime for when the signal occurred (from API `datetime_signal_occurred` or equivalent field), a **separately labeled** datetime for when the signal was archived (from API `datetime_signal_archived` or equivalent field), and a summary line (**description**) that includes:

- **Z-score end** from the API (`z_score_end` or equivalent), formatted with **at most two** fractional decimal digits, and a **brief** plain-language explanation (e.g. deviation of the spread from its typical level at archive time).
- **SNR end** from the API (`snr_end` or equivalent), formatted with **at most two** fractional decimal digits, and a **brief** plain-language explanation (e.g. strength of the signal relative to noise at archive time).

The explanations SHALL be short enough that the summary remains readable on typical mobile widths (wrapping is acceptable; meaning MUST remain clear).

The list presentation (card-like rows, long/short visual distinction, design tokens for radius, shadows, typography, and hover) SHALL align with the live signals list on `/` as specified in the **live-signals** capability (oceanic palette, 24px card radius, long/short badges, hover affordance).

#### Scenario: Successful archives API load shows navigable rows

- **WHEN** the archives API returns a non-empty `data` array with valid entries
- **THEN** the archives page shows one list row per valid entry, each linking to a `/signal/...` URL that the signal detail page can parse, and each row shows long/short tokens, rounded integer allocation percentages, signal occurred time, archived time, and a summary line that includes z-score end and SNR end with at most two decimal places each plus brief explanations

#### Scenario: Empty archives API result

- **WHEN** the archives API succeeds with an empty `data` array
- **THEN** the archives page shows an empty state and does not claim dummy rows as archived signals

#### Scenario: Archives API or transport failure

- **WHEN** the archives API cannot be fetched or returns an unusable response
- **THEN** the archives page shows an explicit error or failure message and the rest of the app shell remains usable

#### Scenario: Archives loading state

- **WHEN** the archives list request has not yet completed
- **THEN** the user sees a loading indicator or skeleton for the list region

#### Scenario: Archives URL not configured

- **WHEN** the archives API URL is not set in configuration
- **THEN** the archives page shows a clear message that the feed is not configured (and does not crash)

#### Scenario: Long and short match archives API semantics

- **WHEN** a list row is shown for an archives API record
- **THEN** the leg labeled long matches `token_long` and the leg labeled short matches `token_short`, and the slug places the long token first with its rounded allocation and the short token second with its rounded allocation
