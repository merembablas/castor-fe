## 1. Config and server data

- [x] 1.1 Add `PUBLIC_NEWS_API_URL` (or agreed env name) to project env example / docs; document optional nature
- [x] 1.2 Implement server-side `fetchNewsList` (or extend `+page.server.ts`) with tunnel header parity to signals fetch, returning parsed payload or null on failure
- [x] 1.3 Add TypeScript interfaces for news API (`data[]`, `elfa`, summary items) in `$lib` (e.g., `symbol-news/`)

## 2. Normalization helpers

- [x] 2.1 Build case-insensitive `Map` from symbol → ordered list of `{ summary, sourceLinks }`
- [x] 2.2 Implement `teaserOneSentence(text: string): string` (first sentence + char cap / ellipsis fallback)

## 3. Live signal list UI

- [x] 3.1 Refactor home list row so primary navigation to `/signal/[slug]` and secondary “All news” control coexist without nested interactive conflicts (per design)
- [x] 3.2 Render per-leg teaser lines (long/short labels) when news exists; omit or neutral empty when missing
- [x] 3.3 Add `<dialog>` (or equivalent) overlay component: grouped summaries for both symbols, scrollable body, `sourceLinks` as `rel="noopener noreferrer"` external links
- [x] 3.4 Wire open/close: button, Escape, backdrop, focus return; `preventDefault` so opening news does not navigate

## 4. Design system and polish

- [x] 4.1 Apply design tokens: 24px panel radius, pill secondary button, glass blur backdrop, teal glow shadow, `#144955` / `#527E88` typography
- [x] 4.2 Verify mobile: no horizontal overflow, readable teasers, usable overlay on small viewports

## 5. Verification

- [x] 5.1 Manual test with configured news URL against sample API; test missing env, failed fetch, partial symbol match
- [x] 5.2 Run project checks (`check` / lint) and fix any new issues
