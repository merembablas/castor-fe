## 1. Dependencies and build configuration

- [ ] 1.1 Add Solana wallet dependencies per `design.md` (`@solana/web3.js`, `@svelte-on-solana/*` packages as confirmed by version spike, wallet list package such as `@solana/wallet-adapter-wallets` if required by the adapter)
- [ ] 1.2 Update `vite.config.ts` with any required polyfills, `optimizeDeps`, or `resolve` aliases per package documentation so the dev server and production build succeed
- [ ] 1.3 Add `PUBLIC_SOLANA_RPC_URL` to `.env.example` (or project env template) with a short comment and a sensible default for local dev

## 2. Wallet providers and layout wiring

- [ ] 2.1 Implement a client-only wallet provider wrapper component that creates the Solana `Connection` from `PUBLIC_SOLANA_RPC_URL` and mounts the adapter’s wallet context without running wallet code during SSR (`$app/environment` `browser`, dynamic import, or equivalent)
- [ ] 2.2 Import the provider wrapper from `src/routes/+layout.svelte` so all pages under the root layout receive wallet context
- [ ] 2.3 Verify SSR: load a few routes with `npm run build` / preview and confirm no server-side throws

## 3. Header UI and design system

- [ ] 3.1 Integrate the adapter’s connect / multi-wallet UI (or minimal custom trigger + library modal) into `src/lib/components/app-header.svelte`, placed with the main nav and responsive wrapping for small viewports
- [ ] 3.2 Apply design-system styles to the primary trigger: `rounded-full`, `bg-[#22C1EE]`, white text, soft teal `box-shadow`, `#22C1EE` focus ring, `min-h-11 min-w-[44px]`, `hover:scale-[1.02]` / brightness per existing header patterns
- [ ] 3.3 Ensure connected state shows a clear label (truncated public key or short “Connected” + menu) and that disconnect or change wallet remains available per library behavior

## 4. Accessibility and verification

- [ ] 4.1 Add discernible accessible names for the wallet control (e.g. `aria-label` where the visible text is abbreviated) and confirm keyboard focus order in the header
- [ ] 4.2 Manually test connect and disconnect with at least one major browser extension wallet on desktop and a narrow viewport width
- [ ] 4.3 Run `npm run check` (or project equivalent) and fix any new TypeScript or Svelte issues
