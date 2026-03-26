## Why

Users need to link a Solana wallet from the app so future on-chain or identity flows have a connected address. The global header is the natural place for connect/disconnect without cluttering chart-focused pages.

## What Changes

- Add a **Connect wallet** control in the main app header, aligned to the **upper right** on larger viewports (consistent with existing sticky glass header).
- Wire connection using a **small Solana dependency set** (core SDK + wallet adapter base; avoid heavy UI kits and pull in wallet implementations selectively).
- Show **connected** state (e.g. truncated public key) and allow **disconnect**.
- Install and document packages using **Bun** only (`bun add`), not npm.

## Capabilities

### New Capabilities

- `solana-wallet`: In-app Solana wallet connection, disconnect, and display of connection state in the main navigation header, styled per the oceanic design system.

### Modified Capabilities

- _(None — no existing OpenSpec capability defines wallet or header auth behavior.)_

## Impact

- **`src/lib/components/app-header.svelte`**: Layout update to place nav + wallet action (row: brand/space left, nav + wallet right on `sm+`).
- **New modules** (e.g. wallet context/store under `$lib`): Adapter initialization, `connect` / `disconnect`, reactive public key.
- **`package.json`**: New dependencies added via **Bun** (`@solana/web3.js`, `@solana/wallet-adapter-base`, and minimal wallet adapter package(s) as chosen in design).
- **SSR**: Wallet APIs are browser-only; guard any adapter usage behind `browser` / `onMount` so SvelteKit SSR does not throw.
