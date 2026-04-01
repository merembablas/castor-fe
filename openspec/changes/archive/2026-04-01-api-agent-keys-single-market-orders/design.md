## Context

The app opens pair trades from the signal detail flow via `execute-pair-trade-client.ts`: it signs `update_leverage` and `create_market_order` with a **wallet `signMessage` adapter**, then POSTs leverage to `/api/pacifica/account/leverage` and submits **both** legs through `/api/pacifica/orders/batch`. Pacifica documents **API Agent Keys**: keep `account` as the user’s main pubkey, sign POST bodies with the **agent** private key, and include **`agent_wallet`** (agent pubkey) per [API Agent Keys](https://pacifica.gitbook.io/docs/api-documentation/api/signing/api-agent-keys). The [Python SDK](https://github.com/pacifica-fi/python-sdk/blob/main/rest/api_agent_keys.py) shows `bind_agent_wallet` (main key signs) then `create_market_order` (agent signs), with `sign_message(signature_header, signature_payload, keypair)` pattern.

## Goals / Non-Goals

**Goals:**

- Make **wallet connect** the place where the user ends up with a **bound** agent wallet and persisted agent secret in **browser storage** (e.g. `localStorage` / `indexedDB`—exact mechanism in implementation).
- Use **agent signing** for **update leverage** and **create market order** during open position (no extension popups for those steps after bind).
- Replace **batch** pair open with **two** sequential single-market creates (long leg, then short leg—or order defined in tasks; both must succeed before treating the action as successful).
- Reuse existing **message canonicalization** (`buildPacificaSignableMessage` / operation types) and extend types if `bind_agent_wallet` is added.

**Non-Goals:**

- Hardening agent key storage (encryption, OS keystore, rotation policy)—explicitly deferred.
- Changing notional split, slug allocations, or market metadata rules.
- Websocket signing (REST-only scope unless already required elsewhere).

## Decisions

1. **Bind once per stored agent + main account**  
   Follow Python: generate `Keypair` for agent; `bind_agent_wallet` signed by **main wallet**; store **agent secret** (e.g. base58) keyed by main `account` string. Rationale: matches Pacifica docs; minimal user friction after first bind.

2. **Where signing runs**  
   Keep signing in the **browser** (same as today) so the server proxy only forwards JSON (and optional headers) to Pacifica; add **`agent_wallet`** to outbound requests as the live API expects (GitBook mentions **header**; Python merges it into JSON—**verify against Pacifica OpenAPI or live responses** during implementation and align the proxy).

3. **Two `create_market_order` calls instead of batch**  
   Call Pacifica `orders/create_market` (or existing REST path) **twice** with separate timestamps/signatures per request (no shared batch timestamp). Rationale: user requirement; avoids batch payload shape; aligns with SDK example which uses a single market POST per signature.

4. **New SvelteKit proxy route**  
   Add `POST /api/pacifica/orders/create-market` (or equivalent) mirroring the leverage proxy pattern, targeting Pacifica `POST /api/v1/orders/create_market` (confirm path in docs). Rationale: batch proxy exists today; single-order proxy is missing.

5. **Connect-time mandatory setup**  
   Block or gate **Open position** until `account` has a bound agent in storage (or show inline recovery: “Sign to enable trading” reusing bind). Rationale: user asked for mandatory at wallet connect.

## Risks / Trade-offs

- **Agent key in client storage** → Anyone with script access on the origin can exfiltrate; mitigated later per user; document in UI copy only if product asks.  
- **Partial fill / first leg succeeds, second fails** → User can be half-exposed; mitigations: sequential submission, clear error, optional future “reconcile” UX (out of scope).  
- **API header vs body for `agent_wallet`** → Mismatch causes 4xx; mitigated by verifying against official docs/OpenAPI during implementation.

## Migration Plan

1. Ship agent bind + storage + new signing path behind the same open-position entry point.  
2. Switch execution from batch to two create-market POSTs.  
3. Remove or stop using batch for **this** flow; keep batch route if unused elsewhere until removed in a follow-up.  
4. Existing users: on first load after deploy, run bind once (wallet signature) then proceed.

## Open Questions

- Exact Pacifica REST path and whether `agent_wallet` must be duplicated in **headers** vs **JSON** for leverage and create-market.  
- Whether `update_leverage` supports the same agent signing as `create_market_order` (assume yes per user; confirm in docs).  
- Preferred storage: `localStorage` vs `indexedDB` for key material size/quotas.
