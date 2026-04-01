/**
 * Pacifica off-chain signing: sorted compact JSON, UTF-8, Ed25519.
 * @see https://pacifica.gitbook.io/docs/api-documentation/api/signing/implementation
 * @see https://pacifica.gitbook.io/docs/api-documentation/api/signing/api-agent-keys
 */

import { ed25519 } from '@noble/curves/ed25519.js';

import { base58Encode } from './base58-encode.js';

export type PacificaOperationType = 'update_leverage' | 'create_market_order' | 'bind_agent_wallet';

export interface PacificaSignatureHeader {
	timestamp: number;
	expiry_window: number;
	type: PacificaOperationType;
}

export function sortJsonKeys(value: unknown): unknown {
	if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
		const obj = value as Record<string, unknown>;
		const sorted: Record<string, unknown> = {};
		for (const key of Object.keys(obj).sort()) {
			sorted[key] = sortJsonKeys(obj[key]);
		}
		return sorted;
	}
	if (Array.isArray(value)) {
		return value.map((item) => sortJsonKeys(item));
	}
	return value;
}

/** Build the exact UTF-8 string the wallet must sign. */
export function buildPacificaSignableMessage(
	header: PacificaSignatureHeader,
	payload: Record<string, unknown>
): string {
	const envelope = {
		...header,
		data: payload
	};
	const sorted = sortJsonKeys(envelope) as Record<string, unknown>;
	return JSON.stringify(sorted);
}

/** Ed25519 64-byte secret key (per Solana `Keypair`): sign UTF-8 Pacifica message. */
export function signPacificaMessageWithSecretKey(
	secretKey64: Uint8Array,
	type: PacificaOperationType,
	payload: Record<string, unknown>,
	timestamp: number = Date.now()
): { timestamp: number; expiry_window: number; signature: string } {
	const expiry_window = 30_000;
	const header: PacificaSignatureHeader = { timestamp, expiry_window, type };
	const message = buildPacificaSignableMessage(header, payload);
	const messageBytes = new TextEncoder().encode(message);
	const sigBytes = ed25519.sign(messageBytes, secretKey64.slice(0, 32));
	return { timestamp, expiry_window, signature: base58Encode(sigBytes) };
}
