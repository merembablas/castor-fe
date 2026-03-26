import { json } from '@sveltejs/kit';
import {
	fetchPacificaMarketInfoList,
	pickMarketRows
} from '$lib/signal/pacifica/market-info-fetch.js';
import type { PacificaMarketInfoRow } from '$lib/signal/pacifica/rest-types.js';
import type { RequestHandler } from './$types';

/** ~24h browser/CDN cache per unique `symbols` query */
const CACHE_CONTROL = 'public, max-age=86400, s-maxage=86400';

function toPublicRow(row: PacificaMarketInfoRow) {
	return {
		symbol: row.symbol.trim().toUpperCase(),
		maxLeverage: row.max_leverage,
		lotSize: row.lot_size,
		minOrderSize: row.min_order_size,
		tickSize: row.tick_size,
		minTick: row.min_tick,
		maxTick: row.max_tick
	};
}

export const GET: RequestHandler = async ({ url, locals }) => {
	const raw = url.searchParams.get('symbols');
	if (!raw?.trim()) {
		return json({ success: false as const, error: 'Missing symbols' }, { status: 400 });
	}

	const parts = raw
		.split(',')
		.map((s) => s.trim().toUpperCase())
		.filter(Boolean);
	const unique = [...new Set(parts)];
	if (unique.length === 0) {
		return json({ success: false as const, error: 'No symbols' }, { status: 400 });
	}

	const auth = locals.pacificaApiAuthorization?.trim();

	try {
		const list = await fetchPacificaMarketInfoList({
			baseUrl: locals.pacificaApiBaseUrl,
			authorization: auth || undefined
		});
		const picked = pickMarketRows(list, unique);
		const data: Record<string, ReturnType<typeof toPublicRow>> = {};
		const missing: string[] = [];
		for (const sym of unique) {
			const row = picked.get(sym);
			if (row) {
				data[sym] = toPublicRow(row);
			} else {
				missing.push(sym);
			}
		}

		const headers = new Headers({ 'Cache-Control': CACHE_CONTROL });
		return json(
			{
				success: true as const,
				data,
				missing: missing.length ? missing : undefined
			},
			{ headers }
		);
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Market info fetch failed';
		return json({ success: false as const, error: message }, { status: 502 });
	}
};
