## Requirements

### Requirement: News API URL is configurable

The system SHALL support an optional absolute HTTP(S) URL for the **news** JSON endpoint (including path, e.g. `.../news`) supplied via application configuration (environment variable). When this URL is unset or blank, the system SHALL NOT request news and SHALL NOT treat that as an error for the live signals page.

#### Scenario: News URL not configured

- **WHEN** the news URL environment variable is unset or empty
- **THEN** the live signals page loads without fetching news and without showing news-specific error states

#### Scenario: News URL is configured

- **WHEN** the news URL is set to a valid absolute URL
- **THEN** the system MAY perform a GET request to that URL when loading the live signals page data (or equivalent single batch), using the same tunnel-friendly request headers as other configured JSON feeds where applicable

### Requirement: News response is parsed into per-symbol summaries

When a news response is successfully retrieved and has HTTP success status, the system SHALL parse a payload shaped such that a top-level `data` array contains entries with at least `symbol` (string) and nested summaries. For each entry, when `elfa.success` is true and `elfa.data` is a non-empty array, each element SHALL be treated as one **summary item** with at least a string `summary` and zero or more strings in `sourceLinks`. When parsing fails or the shape is unexpected, the system SHALL treat news as unavailable for display without crashing the page.

#### Scenario: Valid payload yields lookup by symbol

- **WHEN** the response matches the expected shape with at least one symbol entry that has summaries
- **THEN** the implementation can resolve all summary items for a given symbol string using **case-insensitive** symbol matching

#### Scenario: Malformed or unsuccessful response

- **WHEN** the response is not JSON, missing expected fields, or the HTTP status is not successful
- **THEN** the page continues to render live signals and news is omitted or degraded per the live-signals capability without throwing

### Requirement: Teaser text is one sentence per symbol

For display on a signal card, the system SHALL derive **at most one** user-visible sentence of news per leg symbol from the first available summary item for that symbol. The system SHALL NOT show the full multi-sentence API text inline on the card. Derivation SHALL use a deterministic rule (e.g. first sentence by punctuation split, with an optional maximum character fallback and ellipsis).

#### Scenario: Long summary on card

- **WHEN** the first summary for a symbol contains multiple sentences
- **THEN** only the first sentence (or truncated equivalent per the rule) is shown on the card
