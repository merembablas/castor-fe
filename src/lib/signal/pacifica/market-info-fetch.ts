/**
 * Pacifica REST GET /api/v1/info — all markets; filter client-side or in our API route.
 * @see https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/markets/get-market-info
 */
import type { PacificaMarketInfoListResponse, PacificaMarketInfoRow } from './rest-types.js';

function normalizeBase(baseUrl: string): string {
	return baseUrl.replace(/\/+$/, '');
}

export interface FetchPacificaMarketInfoListOptions {
	baseUrl: string;
	authorization?: string;
	fetchFn?: typeof fetch;
}

export async function fetchPacificaMarketInfoList(
	options: FetchPacificaMarketInfoListOptions
): Promise<PacificaMarketInfoRow[]> {
	const { baseUrl, authorization, fetchFn = fetch } = options;

	const u = new URL('/api/v1/info', `${normalizeBase(baseUrl)}/`);
	const headers = new Headers({ Accept: 'application/json' });
	if (authorization) {
		headers.set('Authorization', authorization);
	}

	const res = await fetchFn(u.toString(), { headers });
	if (!res.ok) {
		throw new Error(`Pacifica market info HTTP ${res.status}`);
	}

	const body = (await res.json()) as PacificaMarketInfoListResponse;
	if (!body.success || !Array.isArray(body.data)) {
		throw new Error(body.error ?? 'Pacifica market info: success false or missing data');
	}

	return body.data;
}

export function pickMarketRows(
	rows: PacificaMarketInfoRow[],
	symbols: string[]
): Map<string, PacificaMarketInfoRow> {
	const upper = symbols.map((s) => s.trim().toUpperCase());
	const want = new Set(upper);
	const out = new Map<string, PacificaMarketInfoRow>();
	for (const row of rows) {
		const sym = row.symbol.trim().toUpperCase();
		if (want.has(sym)) {
			out.set(sym, row);
		}
	}
	return out;
}
