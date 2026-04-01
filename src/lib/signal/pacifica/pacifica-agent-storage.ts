/**
 * Persists Pacifica API agent private keys in the browser only.
 * Security hardening (encryption, rotation) is intentionally deferred.
 */
const STORAGE_PREFIX = 'castor:pacifica-agent:';

export interface PacificaAgentStored {
	secretKeyBase58: string;
	bound: boolean;
}

export function pacificaAgentStorageKey(mainWalletPubkeyBase58: string): string {
	return `${STORAGE_PREFIX}${mainWalletPubkeyBase58}`;
}

export function loadPacificaAgent(mainWalletPubkeyBase58: string): PacificaAgentStored | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		const raw = localStorage.getItem(pacificaAgentStorageKey(mainWalletPubkeyBase58));
		if (!raw) return null;
		const j = JSON.parse(raw) as unknown;
		if (!j || typeof j !== 'object') return null;
		const o = j as Record<string, unknown>;
		if (typeof o.secretKeyBase58 !== 'string' || typeof o.bound !== 'boolean') return null;
		return { secretKeyBase58: o.secretKeyBase58, bound: o.bound };
	} catch {
		return null;
	}
}

export function savePacificaAgent(
	mainWalletPubkeyBase58: string,
	value: PacificaAgentStored
): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(pacificaAgentStorageKey(mainWalletPubkeyBase58), JSON.stringify(value));
}

export function clearPacificaAgent(mainWalletPubkeyBase58: string): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.removeItem(pacificaAgentStorageKey(mainWalletPubkeyBase58));
}
