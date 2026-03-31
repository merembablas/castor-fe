/**
 * Kline requests use `PACIFICA_MARKET_DATA_API_BASE_URL` when set (see hooks.server.ts → locals.pacificaMarketDataApiBaseUrl);
 * otherwise the same origin as `PACIFICA_API_BASE_URL` (trading REST).
 *
 * Manual QA: With market-data base pointing at Pacifica (or mock),
 * - GET merged path: load `/signal/sol:30-eth:70` and confirm `/api/v1/kline` for SOL and ETH return 200 and `success: true`.
 * - Error: invalid market-data host or blocked network → `chartError` and no fabricated candles.
 * - `success: false` payload from Pacifica should surface as fetch failure.
 */
import type { PacificaCandle, PacificaKlineResponse } from './types.js';

export interface FetchPacificaKlinesOptions {
	baseUrl: string;
	symbol: string;
	interval: string;
	startTimeMs: number;
	endTimeMs?: number;
	/** Full Authorization header value, e.g. `Bearer …` */
	authorization?: string;
	fetchFn?: typeof fetch;
}

function normalizeBase(baseUrl: string): string {
	return baseUrl.replace(/\/+$/, '');
}

export async function fetchPacificaKlines(
	options: FetchPacificaKlinesOptions
): Promise<PacificaCandle[]> {
	const {
		baseUrl,
		symbol,
		interval,
		startTimeMs,
		endTimeMs = Date.now(),
		authorization,
		fetchFn = fetch
	} = options;

	const u = new URL('/api/v1/kline', `${normalizeBase(baseUrl)}/`);
	u.searchParams.set('symbol', symbol);
	u.searchParams.set('interval', interval);
	u.searchParams.set('start_time', String(startTimeMs));
	u.searchParams.set('end_time', String(endTimeMs));

	const headers = new Headers({ Accept: 'application/json' });
	if (authorization) {
		headers.set('Authorization', authorization);
	}

	const res = await fetchFn(u.toString(), { headers });
	if (!res.ok) {
		throw new Error(`Pacifica kline HTTP ${res.status}`);
	}

	const body = (await res.json()) as PacificaKlineResponse;
	if (!body.success || !Array.isArray(body.data)) {
		throw new Error(body.error ?? 'Pacifica kline: success false or missing data');
	}

	return body.data;
}
