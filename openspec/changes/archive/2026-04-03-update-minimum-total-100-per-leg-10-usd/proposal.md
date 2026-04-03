## Why

The product wants **higher minimum capital** on signal detail (**$100** total notional instead of **$22**) and a clear **per-leg floor** so each side of a pair trade (long on token A, short on token B) has at least **$10** USD notional before the user can open. That reduces dust legs on skewed allocations and aligns the CTA with both total size and fair minimums on **both** legs.

## What Changes

- Raise the **product minimum total position size** (total amount in USD) from **$22** to **$100**.
- Introduce a **product minimum of $10 USD notional per leg** (estimated long leg and estimated short leg from the allocation split of total notional).
- **Open position** stays **disabled** until **total ≥ $100** and **both** leg estimates are **≥ $10** (in addition to existing gates: wallet, metadata, prices, duplicate slug, etc.).
- Update **user-facing copy** (minimum entry messaging, defaults/sync where applicable) to **$100** total and explain the **$10 per leg** rule where helpful.
- Keep **exchange-derived minimum totals** (lot / min order) as today: effective minimum total SHOULD remain **at least** the greater of **$100**, **per-leg-implied minimum total** (from the $10 rule given allocations), and any **computed exchange floor** when available.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `signal-detail`: USD total minimum, per-leg minimum notional, CTA enablement, default/sync behavior, and on-card copy for opening a position.
- `pacifica-trade-execution`: Align normative text with client-side refusal when leg targets violate product minimums (if execution layer validates); keep exchange min-order behavior unchanged.

## Impact

- **Primary UI:** `src/lib/components/signal-detail-card.svelte` (minimum checks, `openPositionDisabled`, hints, default total sync).
- **Shared sizing:** `src/lib/signal/pacifica/trade-sizing.ts` — constants and any shared helpers for **$100** total floor and **$10** per-leg checks (or derived minimum total from allocations).
- **Optional:** `execute-pair-trade-client.ts` or related client flow if a second-line validation on submit is required.
- **Specs:** `openspec/specs/signal-detail/spec.md`, `openspec/specs/pacifica-trade-execution/spec.md`.
