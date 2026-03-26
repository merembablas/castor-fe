## 1. Dependencies and configuration

- [x] 1.1 Add Solana packages with **Bun only** (never npm): `@solana/web3.js`, `@solana/wallet-adapter-base`, and one wallet package (e.g. `@solana/wallet-adapter-phantom`) per `design.md`.
- [x] 1.2 Document `PUBLIC_SOLANA_RPC_URL` in `.env.example` (or project env template) with a sensible dev fallback (e.g. public devnet/mainnet-beta URL) noted in comments.

## 2. Wallet module (browser-safe)

- [x] 2.1 Create a small `$lib` module (e.g. class in `wallet.svelte.ts`) that constructs `Connection` from `PUBLIC_SOLANA_RPC_URL`, holds the chosen `WalletAdapter`, and exposes reactive `$state` / methods for `connect`, `disconnect`, and derived `publicKey` / `connected`.
- [x] 2.2 Initialize adapters and event listeners only when `browser` is true (e.g. `onMount` in a tiny provider component or guarded factory) so SSR never touches `window`.
- [x] 2.3 Handle missing extension / user rejection with non-throwing UI feedback (inline message or disabled state).

## 3. Header UI and layout

- [x] 3.1 Update `src/lib/components/app-header.svelte` so the wallet control sits at the **trailing** end of the header row on `sm+` (upper-right within the header), with nav links grouped beside it; preserve mobile wrapping and ≥44px touch targets.
- [x] 3.2 Implement disconnected primary pill per design system (`#22C1EE`, white text, `rounded-full`, soft teal shadow, `hover:scale-[1.02]` / brightness); connected state shows truncated address and a secondary-style disconnect control (`#22C1EE` border or `#B9E9F6` background).
- [x] 3.3 Ensure focus-visible outline (`#22C1EE`) and accessible names (e.g. `aria-label` on icon-only or abbreviated controls).

## 4. Verification

- [x] 4.1 Manually verify connect/disconnect with the shipped wallet extension; confirm no console errors on hard refresh (SSR → hydrate).
- [x] 4.2 Spot-check narrow viewport: header does not overflow horizontally; wallet control remains tappable.
