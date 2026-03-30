/**
 * Pacifica REST GET /api/v1/info/prices — mark/mid per symbol.
 * @see https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/markets/get-prices
 */
import type { PacificaPriceRow, PacificaPricesListResponse } from './rest-types.js';

function normalizeBase(baseUrl: string): string {
	return baseUrl.replace(/\/+$/, '');
}

export interface FetchPacificaPricesListOptions {
	baseUrl: string;
	authorization?: string;
	fetchFn?: typeof fetch;
}

export async function fetchPacificaPricesList(
	options: FetchPacificaPricesListOptions
): Promise<PacificaPriceRow[]> {
	const { baseUrl, authorization, fetchFn = fetch } = options;

	const u = new URL('/api/v1/info/prices', `${normalizeBase(baseUrl)}/`);
	const headers = new Headers({ Accept: 'application/json' });
	if (authorization) {
		headers.set('Authorization', authorization);
	}

	const res = await fetchFn(u.toString(), { headers });
	if (!res.ok) {
		throw new Error(`Pacifica prices HTTP ${res.status}`);
	}

	const body = (await res.json()) as PacificaPricesListResponse;
	if (!body.success || !Array.isArray(body.data)) {
		throw new Error(body.error ?? 'Pacifica prices: success false or missing data');
	}

	return body.data;
}
