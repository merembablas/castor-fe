import { error, json } from '@sveltejs/kit';
import { fetchPacificaKlines } from '$lib/signal/pacifica/kline-fetch.js';
import { toPacificaSymbol } from '$lib/signal/pacifica/symbol.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const symbolRaw = url.searchParams.get('symbol');
	const interval = url.searchParams.get('interval') ?? '1h';
	const startStr = url.searchParams.get('start_time');
	const endStr = url.searchParams.get('end_time');

	if (!symbolRaw || !startStr) {
		error(400, 'Missing symbol or start_time');
	}

	const startTimeMs = Number(startStr);
	const endTimeMs = endStr ? Number(endStr) : Date.now();
	if (!Number.isFinite(startTimeMs) || !Number.isFinite(endTimeMs)) {
		error(400, 'Invalid start_time or end_time');
	}

	const symbol = toPacificaSymbol(symbolRaw);
	const auth = locals.pacificaApiAuthorization?.trim();

	try {
		const data = await fetchPacificaKlines({
			baseUrl: locals.pacificaMarketDataApiBaseUrl,
			symbol,
			interval,
			startTimeMs,
			endTimeMs,
			authorization: auth || undefined
		});
		return json({ success: true as const, data });
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Kline fetch failed';
		return json({ success: false as const, error: message }, { status: 502 });
	}
};
