## 1. Signing and types

- [x] 1.1 Extend `pacifica-message-sign` (or adjacent module) with `bind_agent_wallet` operation type and shared `signMessage(header, payload, secretKey)` compatible with existing Pacifica canonical message bytes (mirror Python `sign_message` + [api_agent_keys.py](https://github.com/pacifica-fi/python-sdk/blob/main/rest/api_agent_keys.py)).
- [x] 1.2 Implement a small **agent keypair** helper (generate, serialize to/from base58 for storage) using the same crypto stack already used for Solana/wallet (e.g. `@solana/web3.js` `Keypair`).

## 2. Client storage and bind

- [x] 2.1 Add a client-only module to **load/save/clear** agent key material keyed by main wallet pubkey (e.g. `localStorage` namespaced key); document that security hardening is deferred.
- [x] 2.2 Implement **bind** request construction: `bind_agent_wallet` signed by **wallet adapter** `signMessage`, POST via new or existing proxy to Pacifica `agent/bind` (confirm path against docs).
- [x] 2.3 Wire **wallet connect** flow so after successful connect the app ensures bind: if no stored agent or bind never succeeded, run generate → wallet-sign bind → persist agent secret.

## 3. API proxies

- [x] 3.1 Add `POST /api/pacifica/orders/create-market` (or aligned name) proxying to Pacifica `POST /api/v1/orders/create_market` (verify exact path), same auth/header pattern as `account/leverage` and `orders/batch`.
- [x] 3.2 Confirm whether `agent_wallet` must be sent as HTTP header, JSON field, or both for leverage and create-market; align proxy + client with live API.

## 4. Execute pair trade refactor

- [x] 4.1 Replace wallet `signMessage` adapter usage in `execute-pair-trade-client.ts` for **`update_leverage`** and **`create_market_order`** with **agent key** signing; keep main `account` as user pubkey; include `agent_wallet` per [API Agent Keys](https://pacifica.gitbook.io/docs/api-documentation/api/signing/api-agent-keys).
- [x] 4.2 Remove **`postBatch`** usage for open position; submit **long** `create_market_order` then **short** `create_market_order` (separate timestamps/signatures) via the new create-market proxy; preserve sizing, slippage, and sequential leverage updates.
- [x] 4.3 Update `signal-detail-card.svelte` (or caller) to pass agent-capable signer context and to block or prompt if agent not bound.

## 5. Cleanup and verification

- [x] 5.1 Stop importing or calling batch orders from the open-position path; remove dead code or leave batch route only if still referenced elsewhere.
- [x] 5.2 Manual test: connect → bind once → open position: two market orders succeed, no wallet popups for leverage/market after bind; disconnect/reconnect reuses storage.
- [x] 5.3 Run `check` / lint / typecheck as configured in the repo.
