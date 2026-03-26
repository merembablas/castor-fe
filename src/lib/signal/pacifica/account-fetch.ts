/**
 * Pacifica REST GET /api/v1/account?account=<address>
 * @see https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/account/get-account-info
 */
import type { PacificaAccountInfoResponse } from './rest-types.js';

function normalizeBase(baseUrl: string): string {
	return baseUrl.replace(/\/+$/, '');
}

export interface FetchPacificaAccountOptions {
	baseUrl: string;
	account: string;
	authorization?: string;
	fetchFn?: typeof fetch;
}

export async function fetchPacificaAccount(
	options: FetchPacificaAccountOptions
): Promise<NonNullable<PacificaAccountInfoResponse['data']>> {
	const { baseUrl, account, authorization, fetchFn = fetch } = options;

	const u = new URL('/api/v1/account', `${normalizeBase(baseUrl)}/`);
	u.searchParams.set('account', account.trim());

	const headers = new Headers({ Accept: 'application/json' });
	if (authorization) {
		headers.set('Authorization', authorization);
	}

	const res = await fetchFn(u.toString(), { headers });
	if (!res.ok) {
		throw new Error(`Pacifica account HTTP ${res.status}`);
	}

	const body = (await res.json()) as PacificaAccountInfoResponse;
	if (!body.success || !body.data) {
		throw new Error(body.error ?? 'Pacifica account: success false or missing data');
	}

	return body.data;
}
