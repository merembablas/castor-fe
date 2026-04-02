import { json } from '@sveltejs/kit';
import { fetchPacificaPositions } from '$lib/signal/pacifica/positions-fetch.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const account = url.searchParams.get('account')?.trim();
	if (!account) {
		return json({ success: false as const, error: 'Missing account' }, { status: 400 });
	}

	const auth = locals.pacificaApiAuthorization?.trim();

	try {
		const rows = await fetchPacificaPositions({
			baseUrl: locals.pacificaApiBaseUrl,
			account,
			authorization: auth || undefined
		});

		return json({ success: true as const, data: rows });
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Positions fetch failed';
		return json({ success: false as const, error: message }, { status: 502 });
	}
};
