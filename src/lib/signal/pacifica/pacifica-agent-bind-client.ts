import { base58Encode } from './base58-encode.js';
import { buildPacificaSignableMessage } from './pacifica-message-sign.js';

export interface WalletSignMessageAdapter {
	signMessage(message: Uint8Array): Promise<Uint8Array>;
}

/**
 * One-time bind: main wallet signs `bind_agent_wallet`; Pacifica associates agent_wallet with account.
 */
export async function postBindAgentWallet(input: {
	adapter: WalletSignMessageAdapter;
	account: string;
	agentWalletPubkeyBase58: string;
}): Promise<void> {
	const timestamp = Date.now();
	const expiry_window = 30_000;
	const payload: Record<string, unknown> = { agent_wallet: input.agentWalletPubkeyBase58 };
	const header = { timestamp, expiry_window, type: 'bind_agent_wallet' as const };
	const message = buildPacificaSignableMessage(header, payload);
	const messageBytes = new TextEncoder().encode(message);
	const sigBytes = await input.adapter.signMessage(messageBytes);

	const body = {
		account: input.account,
		signature: base58Encode(sigBytes),
		timestamp,
		expiry_window,
		...payload
	};

	const res = await fetch('/api/pacifica/agent/bind', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify(body)
	});
	const j = (await res.json()) as { success?: boolean; error?: string; data?: unknown };
	if (!res.ok || !j.success) {
		throw new Error(
			typeof j.error === 'string' && j.error ? j.error : 'Could not bind API agent wallet'
		);
	}
	const inner = j.data as { success?: boolean; error?: string } | null | undefined;
	if (inner && typeof inner === 'object' && inner.success === false) {
		throw new Error(
			typeof inner.error === 'string' && inner.error
				? inner.error
				: 'Bind agent wallet was rejected by exchange'
		);
	}
}
