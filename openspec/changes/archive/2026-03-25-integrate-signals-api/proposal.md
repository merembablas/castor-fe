## Why

The home page still lists **dummy** live signals, so users cannot see real pair-trading signals from the backend. Replacing that with the live **signals** HTTP API aligns the UI with production data and surfaces model metrics (**Z-score**, **SNR**) that help users interpret each signal.

## What Changes

- Fetch the signal list from the configured signals API (base URL including `/signals`), replacing in-memory dummy data on `/`.
- Map API fields to the existing long/short list layout: **long** = `token_long` / **short** = `token_short`, with allocations from `alloc_a_pct` / `alloc_b_pct` aligned to the API’s `symbol_a` / `symbol_b` ordering as needed so slugs remain valid for `/signal/[slug]`.
- **Allocation percentages** shown in the list (and encoded in detail URLs) SHALL be **rounded to whole integers** (no long decimal tails in the UI or slug).
- Each row’s **description** (summary line) SHALL include **Z-score** and **SNR** (signal-to-noise ratio), each formatted to **at most two decimal places**, plus a **short plain-language explanation** of what each metric means (one clause or phrase each is enough).
- Handle API/transport failures: loading and error states on the home list (empty list with message or inline error), without breaking the rest of the app.
- **Configurable base URL** for the signals API (environment variable) so ngrok or other hosts can be swapped without code changes.

## Capabilities

### New Capabilities

- _(none — behavior extends existing live signals listing)_

### Modified Capabilities

- `live-signals`: Home list SHALL be backed by the real signals API instead of dummy data; requirements for row content SHALL include Z-score and SNR in the description with brief explanations and the numeric formatting rules above; slug generation SHALL use integer-rounded allocations.

## Impact

- **`src/routes/+page.svelte`** (and likely **`+page.server.ts`** or **`+page.ts`** load): data source and loading/error UI.
- **`src/lib/live-signals/`**: types, fetch helper, mapping from API JSON to list view models; remove or stop using dummy-only paths for production list.
- **Environment**: new public or private env var for signals API origin (document in `.env.example` if present).
- **External dependency**: runtime availability of `https://65d8-2400-8902-00-2000-2fff-fe43-b92.ngrok-free.app/signals` (or equivalent) and any headers ngrok-free tier may require (`ngrok-skip-browser-warning` is a common need for server-side fetch).
