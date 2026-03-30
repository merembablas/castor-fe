import { json } from '@sveltejs/kit';
import { fetchPacificaPricesList } from '$lib/signal/pacifica/prices-fetch.js';
import { toPacificaSymbol } from '$lib/signal/pacifica/symbol.js';
import type { RequestHandler } from './$types';

const CACHE_CONTROL = 'public, max-age=15, s-maxage=15';

/** Map uppercase symbol → mark price string (Pacifica decimal strings). */
export const GET: RequestHandler = async ({ url, locals }) => {
	const raw = url.searchParams.get('symbols');
	const want = raw
		? [...new Set(raw.split(',').map((s) => toPacificaSymbol(s)).filter(Boolean))]
		: [];

	const auth = locals.pacificaApiAuthorization?.trim();

	try {
		const list = await fetchPacificaPricesList({
			baseUrl: locals.pacificaApiBaseUrl,
			authorization: auth || undefined
		});

		const bySymbol: Record<string, string> = {};
		for (const row of list) {
			const sym = toPacificaSymbol(row.symbol);
			if (want.length > 0 && !want.includes(sym)) continue;
			const px = row.mark?.trim() || row.mid?.trim();
			if (px) bySymbol[sym] = px;
		}

		const headers = new Headers({ 'Cache-Control': CACHE_CONTROL });
		return json({ success: true as const, bySymbol }, { headers });
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Prices fetch failed';
		return json({ success: false as const, error: message }, { status: 502 });
	}
};
