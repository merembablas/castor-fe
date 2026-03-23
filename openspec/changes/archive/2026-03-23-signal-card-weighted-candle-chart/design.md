## Context

The signal detail card (`signal-detail-card.svelte`) embeds `signal-candlestick-chart.svelte`, which today consumes an in-memory list of `SignalCandlestickPoint` values. The product goal is to show a **two-leg weighted price ratio** that matches the signal slug (e.g. `/signal/sol:30-eth:70`: 30% long on token A, 70% short on token B). Pacifica documents a REST kline API and a WebSocket candle stream ([Get candle data](https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/markets/get-candle-data), [Candle subscription](https://pacifica.gitbook.io/docs/api-documentation/api/websocket/subscriptions/candle)).

The UI stack is Svelte 5, SvelteKit, TypeScript, lightweight-charts, and Tailwind; charts must stay readable on mobile.

## Goals / Non-Goals

**Goals:**

- Load initial history for **both** symbols with default interval **`1h`**, then keep the last candle (and subsequent bars) updated via **two** WebSocket candle subscriptions.
- Compute a **weighted ratio series** from aligned candles: for each timestamp, combine prices with exponents derived from slug allocations — **long (token A) positive**, **short (token B) negative**, e.g. weights \(w_A = A/100\), \(w_B = -B/100\) and ratio factor \(P_A^{w_A} \cdot P_B^{w_B}\) using Pacifica’s decimal string prices parsed to finite positive numbers.
- Integrate the result into the existing signal card chart without breaking layout, design tokens, or accessibility.

**Non-Goals:**

- Perfect arbitrage-grade intrabar extrema for the ratio (would need tick data).
- Multi-exchange aggregation or backends other than Pacifica.
- User-selectable intervals in the first iteration (default `1h` only unless already trivial to expose).

## Decisions

1. **Where HTTP/WebSocket run (client vs server)**  
   **Choice:** Implement Pacifica access behind **SvelteKit server endpoints** (e.g. `+server.ts` or load-based fetch) for REST, and either **server-side WS proxy** or **documented client WS** depending on CORS/auth. Prefer **server proxy** if the browser cannot reach Pacifica directly or if credentials are required.  
   **Rationale:** Hides base URL, avoids CORS pain, and keeps secrets in env.  
   **Alternative:** Call REST from `load` only and WS from client — simpler but may fail on CORS; keep as fallback if proxy is unnecessary.

2. **Aligning two candle series**  
   **Choice:** Index candles by Pacifica **`t`** (bar open time in ms). Only emit synthetic bars where **both** symbols have a candle for the same `t`; optionally forward-fill gaps only if explicitly specified later (default: **no forward-fill** to avoid fake bars).  
   **Rationale:** Deterministic merge for REST; WS updates can patch the same key.

3. **Synthetic OHLC definition**  
   **Choice:** For each aligned bar, parse `o,h,l,c` per symbol to numbers \(> 0\), then set synthetic `open, high, low, close` as  
   \(X_{\text{syn}} = X_A^{w_A} \cdot X_B^{w_B}\) for \(X \in \{o,h,l,c\}\) using the **same** exponents on each component.  
   **Rationale:** Straightforward, matches stakeholder “raise each price to its weight” wording, and plugs into candlestick charts.  
   **Trade-off:** High/low of the ratio over the interval are not guaranteed equal to combining marginal highs/lows; acceptable for visualization per Non-Goals.

4. **Realtime merge**  
   **Choice:** Maintain latest partial bar per symbol keyed by `t`; recompute the synthetic bar when either leg updates; when `t` advances on a leg, follow REST ordering rules to append or replace bars consistently with lightweight-charts expectations.  
   **Rationale:** Matches Pacifica push model where each message is one candle object.

5. **Symbol mapping**  
   **Choice:** Map `SignalDetailViewModel.tokenA` / `tokenB` to Pacifica `symbol` strings via a small normalizer (e.g. uppercase, allow config table for exceptions).  
   **Rationale:** Slugs use tickers like `SOL`, `ETH`; Pacifica examples use the same style.

6. **Exponent typo vs slug**  
   **Choice:** Exponents **MUST** come from parsed slug allocations: \(w_A = \text{allocationA}/100\), \(w_B = -\text{allocationB}/100\). Narrative examples that use different literals (e.g. 0.5 vs 0.3) are **not** authoritative.  
   **Rationale:** Single source of truth from routing/parser.

## Risks / Trade-offs

- **[Risk] Pacifica downtime or rate limits** → Show chart error/empty state; backoff and manual retry affordance in UI.  
- **[Risk] WebSocket disconnects** → Reconnect with exponential backoff; refetch REST window overlapping last N bars to heal gaps.  
- **[Risk] Invalid or non-positive price strings** → Skip bar or mark series degraded; log in dev.  
- **[Risk] Synthetic OHLC approximation** → Document in code comment and spec; future improvement could use close-only or true intrabar optimization.  
- **[Risk] CORS** → Mitigated by server proxy decision.

## Migration Plan

- Ship behind no feature flag if the app is pre-production; otherwise optional env `PUBLIC_PACIFICA_*` to enable live data with fallback to empty state.  
- Rollout: merge data layer first, then wire chart; verify one known slug (e.g. SOL/ETH) in staging.  
- Rollback: revert to static/mock series commit or guard with env disable.

## Open Questions

- Exact Pacifica **base URL** and whether **authentication** is required for REST/WS in this deployment.  
- Whether token slugs ever include variants (e.g. `WBTC` vs `BTC`) requiring a mapping table.  
- Desired **history depth** (how far back `start_time` should be set) for initial load — product default (e.g. 30/90 days) to be confirmed.
