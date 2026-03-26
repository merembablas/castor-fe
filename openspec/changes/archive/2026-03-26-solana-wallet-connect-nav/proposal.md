## Why

Users need a consistent way to connect a Solana wallet from any page so future on-chain or authenticated flows can rely on a single wallet context. A global navigation control avoids duplicating connect UI and matches common dApp patterns.

## What Changes

- Add a **Connect wallet** control in the main app header (`AppHeader`), visible on every route that uses the root layout.
- Integrate a **maintained Solana wallet stack** (adapter + Svelte integration) so discovery, connection, disconnection, and wallet switching are handled by the library rather than custom edge-case logic.
- Style the control to match the **oceanic design system** (pill primary button, `#22C1EE` / `#144955`, soft glow, hover scale) so it aligns with existing nav links.
- Expose **connected state** (e.g. truncated public key or “Connected”) for clear feedback; **disconnect** must be available without leaving the page.
- Add **configuration** for Solana RPC endpoint (e.g. env-driven) suitable for the chosen adapter stack.

## Capabilities

### New Capabilities

- `solana-wallet`: Global Solana wallet connection in the app shell—connect/disconnect, wallet selection where the library provides it, connected address display, and SSR-safe provider wiring for SvelteKit.

### Modified Capabilities

- _(none — no existing OpenSpec capability covers wallet or shell navigation behavior.)_

## Impact

- **`src/lib/components/app-header.svelte`**: Placement and styling of the connect control next to existing nav links.
- **`src/routes/+layout.svelte`** (and/or a small wrapper module under `$lib`): Wallet / connection **context providers** required by the chosen Svelte Solana adapter, without breaking SSR.
- **`package.json`**: New dependencies (e.g. `@solana/web3.js`, Solana wallet adapter packages, and a **Svelte-oriented** adapter such as **`@svelte-on-solana/wallet-adapter`** or equivalent maintained UI/core packages—final choice in `design.md`).
- **`vite.config.ts`**: Possible **Node polyfills / resolve aliases** for Solana client libraries in the browser bundle.
- **Environment**: `PUBLIC_SOLANA_RPC_URL` (or project convention) for cluster/RPC.
- **No breaking changes** to existing chart or signal routes unless a future change consumes wallet state.
