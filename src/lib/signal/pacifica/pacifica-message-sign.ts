/**
 * Pacifica off-chain signing: sorted compact JSON, UTF-8, Ed25519 via wallet.
 * @see https://pacifica.gitbook.io/docs/api-documentation/api/signing/implementation
 */

export type PacificaOperationType = 'update_leverage' | 'create_market_order';

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
