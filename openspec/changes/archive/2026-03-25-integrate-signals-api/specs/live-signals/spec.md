## MODIFIED Requirements

### Requirement: Home page lists new signals with navigation to detail

The system SHALL display on `/` a list of signal entries loaded from the **signals** HTTP API. The absolute URL for the list request (including path, e.g. `.../signals`) SHALL be supplied via application configuration (environment variable). Each successful response SHALL yield zero or more list rows derived from the response `data` array. While the list request is in progress, the system SHALL show a loading state. When the request fails (network error, non-success HTTP status, or payload that cannot be interpreted as the expected shape), the system SHALL show an error state and SHALL NOT crash the page. When `data` is empty, the system SHALL show an appropriate empty state.

For each API item, the **long** leg in the UI SHALL correspond to `token_long` and the **short** leg to `token_short`. Allocation percentages used in the list and encoded in the detail URL SHALL be **whole integers** in the inclusive range 0–100, obtained by **rounding** `alloc_a_pct` and `alloc_b_pct` according to which of `symbol_a` / `symbol_b` matches the long and short tokens respectively (so the long token’s allocation and short token’s allocation are each rounded integers).

Each entry SHALL be implemented as a control that navigates to `/signal/[slug]` where `slug` conforms to the pattern `TOKEN_A:ALLOCATION_A-TOKEN_B:ALLOCATION_B` with **TOKEN_A** the long token, **TOKEN_B** the short token, and **ALLOCATION_A** / **ALLOCATION_B** the rounded integer allocations for those legs. Rows whose tokens would not satisfy the signal detail slug parser SHALL be omitted or otherwise not presented as navigable signals.

Each row SHALL show token A and token B with their allocation percentages, a generated datetime for the signal (from API `datetime_signal_occurred` or equivalent field), and a summary line (**description**) that includes:

- **Z-score** from the API, formatted with **at most two** fractional decimal digits, and a **brief** plain-language explanation (e.g. deviation of the spread from its typical level).
- **SNR** (signal-to-noise ratio) from the API, formatted with **at most two** fractional decimal digits, and a **brief** plain-language explanation (e.g. strength of the signal relative to noise).

The Z-score and SNR explanations SHALL be short enough that the summary remains readable on typical mobile widths (wrapping is acceptable; meaning MUST remain clear).

#### Scenario: Successful API load shows navigable rows

- **WHEN** the signals API returns a non-empty `data` array with valid entries
- **THEN** the home page shows one list row per valid entry, each linking to a `/signal/...` URL that the signal detail page can parse, and each row shows long/short tokens, rounded integer allocation percentages, signal time, and a summary line that includes Z-score and SNR with at most two decimal places each plus brief explanations

#### Scenario: Empty API result

- **WHEN** the signals API succeeds with an empty `data` array
- **THEN** the home page shows an empty state and does not claim dummy or placeholder rows as live signals

#### Scenario: API or transport failure

- **WHEN** the signals API cannot be fetched or returns an unusable response
- **THEN** the home page shows an explicit error or failure message and the rest of the app shell remains usable

#### Scenario: Loading state

- **WHEN** the list request has not yet completed
- **THEN** the user sees a loading indicator or skeleton for the list region

#### Scenario: Long and short match API semantics

- **WHEN** a list row is shown for an API record
- **THEN** the leg labeled long matches `token_long` and the leg labeled short matches `token_short`, and the slug places the long token first with its rounded allocation and the short token second with its rounded allocation
