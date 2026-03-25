import type { SignalsApiMeta, SignalsApiResponse, SignalsApiRow } from './signals-api.types.js';

const NGROK_SKIP_WARNING = 'ngrok-skip-browser-warning';

function isRecord(val: unknown): val is Record<string, unknown> {
	return typeof val === 'object' && val !== null;
}

function isApiRow(val: unknown): val is SignalsApiRow {
	if (!isRecord(val)) return false;
	const n = (k: string) => typeof val[k] === 'number' && Number.isFinite(val[k] as number);
	const s = (k: string) => typeof val[k] === 'string';
	return (
		n('z_score') &&
		n('snr') &&
		s('token_long') &&
		s('token_short') &&
		s('symbol_a') &&
		s('symbol_b') &&
		n('alloc_a_pct') &&
		n('alloc_b_pct') &&
		s('datetime_signal_occurred')
	);
}

function parseSignalsResponse(json: unknown): SignalsApiResponse | null {
	if (!isRecord(json) || !Array.isArray(json.data) || !isRecord(json.meta)) return null;
	const rawMeta = json.meta;
	if (typeof rawMeta.generated_at !== 'string') return null;
	const meta: SignalsApiMeta = {
		generated_at: rawMeta.generated_at,
		...(typeof rawMeta.source === 'string' ? { source: rawMeta.source } : {}),
		...(typeof rawMeta.source_present === 'boolean'
			? { source_present: rawMeta.source_present }
			: {})
	};
	const rows = json.data.filter(isApiRow);
	return { data: rows, meta };
}

export type FetchSignalsResult =
	| { ok: true; body: SignalsApiResponse }
	| { ok: false; error: string };

/**
 * Server-only GET of the signals JSON API. Sends ngrok-free bypass header when calling tunnel hosts.
 */
export async function fetchSignalsList(url: string): Promise<FetchSignalsResult> {
	let parsedUrl: URL;
	try {
		parsedUrl = new URL(url);
	} catch {
		return { ok: false, error: 'Invalid signals API URL' };
	}

	const headers: Record<string, string> = { Accept: 'application/json' };
	if (parsedUrl.hostname.endsWith('.ngrok-free.app') || parsedUrl.hostname.endsWith('.ngrok.io')) {
		headers[NGROK_SKIP_WARNING] = 'true';
	}

	try {
		const res = await fetch(url, { headers });
		if (!res.ok) {
			return { ok: false, error: `Signals API returned HTTP ${res.status}` };
		}
		const json: unknown = await res.json();
		const body = parseSignalsResponse(json);
		if (!body) {
			return { ok: false, error: 'Signals API response was not valid JSON' };
		}
		return { ok: true, body };
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Could not reach signals API';
		return { ok: false, error: msg };
	}
}
