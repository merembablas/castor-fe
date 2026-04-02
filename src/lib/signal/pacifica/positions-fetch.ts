/**
 * Pacifica REST GET /api/v1/positions?account=<address>
 * @see https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/account/get-positions
 */
import type { PacificaPositionRow, PacificaPositionsListResponse } from './rest-types.js';

function normalizeBase(baseUrl: string): string {
	return baseUrl.replace(/\/+$/, '');
}

export interface FetchPacificaPositionsOptions {
	baseUrl: string;
	account: string;
	authorization?: string;
	fetchFn?: typeof fetch;
}

export async function fetchPacificaPositions(
	options: FetchPacificaPositionsOptions
): Promise<PacificaPositionRow[]> {
	const { baseUrl, account, authorization, fetchFn = fetch } = options;

	const u = new URL('/api/v1/positions', `${normalizeBase(baseUrl)}/`);
	u.searchParams.set('account', account.trim());

	const headers = new Headers({ Accept: 'application/json' });
	if (authorization) {
		headers.set('Authorization', authorization);
	}

	const res = await fetchFn(u.toString(), { headers });
	if (!res.ok) {
		throw new Error(`Pacifica positions HTTP ${res.status}`);
	}

	const body = (await res.json()) as PacificaPositionsListResponse;
	if (!body.success || !body.data) {
		throw new Error(body.error ?? 'Pacifica positions: success false or missing data');
	}

	return body.data;
}
