## Why

Pacifica’s [API Agent Keys](https://pacifica.gitbook.io/docs/api-documentation/api/signing/api-agent-keys) let a dedicated **agent wallet** sign REST payloads on behalf of the user’s main account, which removes repeated wallet-extension prompts during **set leverage** and **create market order** and improves the open-position experience. The app currently opens pair positions via a **single batch** request; moving to **two separate create-market calls** (one long leg, one short leg) matches the documented agent-key flow (see [Python SDK example](https://github.com/pacifica-fi/python-sdk/blob/main/rest/api_agent_keys.py#L81-L135)) and simplifies the execution path.

## What Changes

- **API agent wallet (mandatory at wallet connect):** After the user connects a Solana wallet, the app SHALL ensure a Pacifica agent keypair exists and is **bound** to that account (e.g. `POST …/agent/bind` with `type: bind_agent_wallet`, main wallet signs the bind payload once). The **agent private key** SHALL be stored in **client-side storage** (exact store TBD in implementation; security hardening deferred per product decision).
- **Signing for trading actions:** For **update leverage** and **create market order** in the open-position flow, the app SHALL **not** use the wallet extension to sign those payloads; it SHALL sign with the **agent private key** while still sending the user’s **main wallet public key** as `account` and including **`agent_wallet`** (agent public key) as required by Pacifica (header and/or body per API).
- **Remove batch for position open:** Pair position creation SHALL **not** use the batch orders endpoint for the two legs. Instead, the app SHALL submit **two** `create_market` (or equivalent documented single-market) requests: one for the **long** symbol and one for the **short** symbol, preserving existing sizing and leverage rules.
- **BREAKING:** Any code, tests, or assumptions that rely on `POST /api/v1/orders/batch` for opening the pair MUST be updated to the two-call flow.

## Capabilities

### New Capabilities

- `pacifica-api-agent-keys`: Generate or load agent keypair, bind to account (one-time main-wallet signature), persist agent secret in browser storage, and expose signing helpers consistent with Pacifica’s signing rules and the [python-sdk `api_agent_keys.py`](https://github.com/pacifica-fi/python-sdk/blob/main/rest/api_agent_keys.py) reference.

### Modified Capabilities

- `pacifica-trade-execution`: Replace batch open with two single market orders; require API agent signing for leverage updates and market creates on this path; keep notional split, metadata, and success-gating behavior aligned with existing requirements where they still apply.
- `solana-wallet`: Extend the connect flow so a **connected** session implies readiness to trade with a **bound** agent wallet (or a clear in-flow step to complete bind before trading).

## Impact

- **Code:** `src/lib/signal/pacifica/execute-pair-trade-client.ts` (batch → two singles; signing adapter vs agent signer), Pacifica API routes under `src/routes/api/pacifica/`, message signing utilities, wallet connect UI/state, optional new storage module.
- **APIs:** Use of `/agent/bind`, single `create_market` / `orders/create_market` proxy; reduced or removed use of batch proxy for **open pair** (batch route may remain for other uses if any).
- **Dependencies:** Solana/ed25519 signing compatible with existing `sign_message` semantics (mirror Python `sign_message` + operation types such as `bind_agent_wallet`, `update_leverage`, `create_market_order`).
