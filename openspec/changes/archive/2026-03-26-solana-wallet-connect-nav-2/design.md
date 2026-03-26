## Context

Castor uses a shared `AppHeader` (`src/lib/components/app-header.svelte`) with glassmorphism styling and pill nav links. There is no wallet integration today. The user asked for a **minimal-dependency** Solana connect flow, **upper-right** placement in the header, styling per **design-system-ui-ux** (teals, pills, soft glow, hover scale), and **Bun-only** installs (`bun add`, never npm).

## Goals / Non-Goals

**Goals:**

- Browser-only wallet connect/disconnect with clear UI state in the header.
- Small, explicit dependency footprint; avoid full wallet UI kits and avoid `@solana/wallet-adapter-wallets` (large aggregate) unless later justified.
- SSR-safe: no `window` / adapter ctor side effects during server render.
- Use `PUBLIC_SOLANA_RPC_URL` (or equivalent) for `Connection` with a dev fallback documented in tasks.

**Non-Goals:**

- Signing transactions or program integration beyond what connect/disconnect requires.
- Persisting wallet choice across devices server-side (local persistence optional later).
- Supporting every wallet on day one; start with one adapter package, extend deliberately.

## Decisions

1. **Package manager**  
   All new dependencies MUST be added with **Bun** (`bun add <pkg>`). Document this in `tasks.md` so implementers do not use npm.

2. **Minimal Solana stack**  
   - **`@solana/web3.js`**: `Connection` and core types.  
   - **`@solana/wallet-adapter-base`**: `WalletAdapter` interface and standard events.  
   - **One wallet implementation** initially, e.g. **`@solana/wallet-adapter-phantom`**, so users with Phantom can connect without pulling the full `wallet-adapter-wallets` meta-package.  
   **Alternatives considered:** `wallet-adapter-wallets` (simpler code, many transitive deps — rejected for “minimum dependency”); raw `window.solana` only (smallest, but non-standard and brittle — rejected as primary approach).

3. **State and wiring in Svelte 5**  
   Use a small module (e.g. `$lib/solana/wallet.svelte.ts` class or store) holding `$state` for `publicKey`, `connected`, and adapter reference; initialize adapter + `Connection` inside **`onMount`** or behind `$app/environment` `browser` checks only.

4. **Header layout**  
   On `sm` and up: single row with primary nav and wallet control grouped toward the **end** (visual upper-right within the header container). On narrow screens: stack or wrap so the wallet control remains reachable without horizontal overflow (touch targets ≥ 44px).

5. **Visual design**  
   Disconnected: primary pill button — solid `#22C1EE`, white label text, `rounded-full`, soft teal `box-shadow`, `hover:scale-[1.02]` / slight brightness per design system. Connected: show truncated address (`base58` prefix/suffix) with secondary `#527E88` / `#144955`; disconnect as secondary (ghost / border `#22C1EE` or `#B9E9F6` background) per rules.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Single-wallet adapter confuses users with other extensions | Copy clarifies “Phantom” or add a second named adapter package later without adopting `wallet-adapter-wallets`. |
| Adapter throws if extension missing | Catch / surface inline message; keep CTA disabled or show “Install a supported wallet” copy. |
| Hydration mismatch if server guesses connection | Server renders disconnected placeholder; client updates after mount only. |

## Migration Plan

1. Land dependencies via Bun and env example for `PUBLIC_SOLANA_RPC_URL`.  
2. Ship wallet module + header UI behind no feature flag (simple rollout).  
3. Rollback: remove header control and deps; no data migration.

## Open Questions

- Whether to add **Solflare** (second small `@solana/wallet-adapter-solflare` dep) immediately after Phantom — defer unless product asks.
