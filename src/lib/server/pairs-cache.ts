import { parsePairsApiResponse } from '$lib/pairs/parse-pairs-api.js';
import type { PairsApiRow, PairsMeta } from '$lib/pairs/types.js';

const TTL_MS = 900_000;

interface CacheEntry {
	rows: PairsApiRow[];
	meta: PairsMeta | undefined;
	fetchedAt: number;
}

const cacheByBase = new Map<string, CacheEntry>();

function normalizeBase(base: string): string {
	return base.trim().replace(/\/+$/, '');
}

export type GetPairsResult =
	| { ok: true; rows: PairsApiRow[]; meta: PairsMeta | undefined }
	| { ok: false; error: string };

/**
 * Fetches `/pairs` from the given API base (no trailing slash), with a 15-minute in-memory TTL per base URL.
 */
export async function getPairsPayload(baseUrl: string): Promise<GetPairsResult> {
	const base = normalizeBase(baseUrl);
	if (!base) {
		return { ok: false, error: 'PAIRS_API_BASE_URL is empty.' };
	}

	const url = `${base}/pairs`;
	const now = Date.now();
	const hit = cacheByBase.get(base);
	if (hit && now - hit.fetchedAt < TTL_MS) {
		return { ok: true, rows: hit.rows, meta: hit.meta };
	}

	try {
		const res = await fetch(url, {
			headers: {
				Accept: 'application/json',
				'ngrok-skip-browser-warning': '1'
			}
		});
		if (!res.ok) {
			return { ok: false, error: `Pairs API returned ${res.status} ${res.statusText}`.trim() };
		}
		const json: unknown = await res.json();
		const parsed = parsePairsApiResponse(json);
		if (!parsed) {
			return { ok: false, error: 'Pairs API returned JSON that could not be parsed.' };
		}
		cacheByBase.set(base, {
			rows: parsed.data,
			meta: parsed.meta,
			fetchedAt: now
		});
		return { ok: true, rows: parsed.data, meta: parsed.meta };
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Unknown error fetching pairs.';
		return { ok: false, error: message };
	}
}
