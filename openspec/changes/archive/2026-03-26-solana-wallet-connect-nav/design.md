## Context

The app uses a single root layout (`src/routes/+layout.svelte`) with `AppHeader` for global navigation (Live signals, Positions, Archives). There is **no** wallet integration today. The user wants **Solana** connect/disconnect available **everywhere** without reimplementing wallet edge cases (extension not installed, multiple wallets, disconnect, account change).

Product styling already follows an **oceanic** palette and glass header; the new control must match `.cursor/rules/design-system-ui-ux.mdc` (pill buttons, `#22C1EE` primary, `#144955` / `#527E88` text, soft teal glow, `hover:scale-[1.02]`).

## Goals / Non-Goals

**Goals:**

- Add a **global Solana wallet** connect control in the header, wired through a **maintained adapter stack** so wallet discovery, connect, disconnect, and reconnection behavior follow library defaults.
- Keep **SvelteKit SSR** working: no wallet APIs on the server; client-only initialization for providers and browser wallets.
- Use **Tailwind** classes aligned with the design system (primary solid pill for main CTA; secondary/ghost for disconnect or secondary actions if needed).
- Configure **RPC / cluster** via public env (e.g. `PUBLIC_SOLANA_RPC_URL`) with a documented default for local dev.

**Non-Goals:**

- Backend session linking, signed message auth, or JWT exchange.
- Sending transactions, Anchor integration, or portfolio logic in this change.
- Replacing or redesigning unrelated header nav patterns beyond making room for the wallet control.

## Decisions

1. **Wallet library (Svelte-first)** — Use the **[svelte-on-solana/wallet-adapter](https://github.com/svelte-on-solana/wallet-adapter)** ecosystem (scoped npm packages under `@svelte-on-solana/*` plus **`@solana/web3.js`** and standard **`@solana/wallet-adapter-wallets`** or equivalent wallet list). **Rationale:** It targets Svelte/SvelteKit directly instead of porting React `WalletModalProvider` patterns. **Alternatives considered:** Raw [Wallet Standard](https://github.com/wallet-standard/wallet-standard) only (more custom UI work); React wallet-adapter UI in a micro-frontend (heavy).

2. **Where providers live** — Introduce a small **client-only wrapper** component (e.g. `wallet-providers.svelte`) imported from `+layout.svelte` that mounts adapter **Connection** + **Wallet** context around `{@render children()}` (or wraps header + main as needed per package API). **Rationale:** Keeps SSR boundaries explicit and matches SvelteKit docs for browser-only APIs.

3. **UI composition** — Prefer **library-provided** modal or wallet list where available; **skin** labels and primary trigger button with design-system Tailwind classes (`rounded-full`, `bg-[#22C1EE]`, `text-white`, `shadow-[0_10px_30px_-10px_rgba(34,193,238,0.2)]`, focus ring `#22C1EE`). **Rationale:** Minimizes custom edge cases while meeting brand. **Trade-off:** If a package ships fixed styles, use wrapper classes / CSS variables only where the library allows.

4. **Header layout** — Place the wallet control in **`app-header.svelte`** in the same row as nav links on `sm+`, stacked or wrapped on small screens with **minimum 44×44px** touch targets to match mobile UX rules.

5. **RPC endpoint** — `PUBLIC_SOLANA_RPC_URL` (full HTTP(S) RPC URL). Default in code or `.env.example` to **devnet** or a public mainnet endpoint for prototyping—**document** rate limits and recommend project-owned RPC for production.

6. **Vite / bundler** — Apply **Solana-recommended** polyfills or `resolve.alias`/`optimizeDeps` adjustments as required by installed packages (often `buffer`, `process`, or `crypto` shims). **Rationale:** Avoid opaque runtime failures in browser builds.

## Risks / Trade-offs

- **[Risk] Svelte 5 / SvelteKit 2 compatibility** — Community packages may lag behind minor versions. **Mitigation:** Pin versions after a quick spike; if blocked, narrow to `@solana/web3.js` + Wallet Standard with a minimal custom modal (fallback documented in tasks).
- **[Risk] SSR leakage** — Accessing `window` or adapters during SSR. **Mitigation:** `browser` check from `$app/environment`, dynamic import, or dedicated client-only boundary component.
- **[Risk] Bundle size** — Wallet deps are large. **Mitigation:** lazy-load modal or wallet list on first click if the adapter supports it.
- **[Trade-off] Styling constraints** — Third-party modal may not match glassmorphism perfectly. **Mitigation:** Style the **header button** to spec; accept or lightly override modal chrome.

## Migration Plan

1. Add dependencies and Vite/env configuration.
2. Add provider wrapper and verify app still builds and SSR renders without errors.
3. Integrate connect control into `app-header.svelte` and manually test connect/disconnect on desktop + narrow viewport.
4. Rollback: remove provider import and dependencies (no data migration).

## Open Questions

- Exact **scoped package names and Svelte 5–tested version** to pin (confirm during implementation spike against current `package.json`).
- Whether to show **cluster name** (devnet/mainnet) next to the button for debugging—optional UX.
