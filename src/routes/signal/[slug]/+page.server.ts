import { error } from '@sveltejs/kit';
import { env as publicEnv } from '$env/dynamic/public';
import { parseSignalSlug } from '$lib/signal/parse-signal-slug.js';
import { fetchPacificaKlines } from '$lib/signal/pacifica/kline-fetch.js';
import {
	PACIFICA_DEFAULT_INTERVAL,
	PACIFICA_INITIAL_HISTORY_MS
} from '$lib/signal/pacifica/types.js';
import { toPacificaSymbol } from '$lib/signal/pacifica/symbol.js';
import { mergeWeightedCandles } from '$lib/signal/pacifica/weighted-merge.js';
import type {
	PacificaChartFeedPayload,
	SignalDetailViewModel
} from '$lib/signal/signal-detail.types.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const parsed = parseSignalSlug(params.slug);
	if (!parsed.ok) {
		error(404, 'Signal not found');
	}

	const { tokenA, allocationA, tokenB, allocationB } = parsed.value;
	const pacificaSymbolA = toPacificaSymbol(tokenA);
	const pacificaSymbolB = toPacificaSymbol(tokenB);

	const endMs = Date.now();
	const startMs = endMs - PACIFICA_INITIAL_HISTORY_MS;
	const auth = locals.pacificaApiAuthorization?.trim();

	let candlesticks: SignalDetailViewModel['candlesticks'] = [];
	let chartError: string | null = null;
	let pacificaFeed: PacificaChartFeedPayload | null = null;

	const wsUrl = publicEnv.PUBLIC_PACIFICA_WS_URL?.trim() || 'wss://ws.pacifica.fi/ws';

	try {
		const [rawA, rawB] = await Promise.all([
			fetchPacificaKlines({
				baseUrl: locals.pacificaApiBaseUrl,
				symbol: pacificaSymbolA,
				interval: PACIFICA_DEFAULT_INTERVAL,
				startTimeMs: startMs,
				endTimeMs: endMs,
				authorization: auth || undefined
			}),
			fetchPacificaKlines({
				baseUrl: locals.pacificaApiBaseUrl,
				symbol: pacificaSymbolB,
				interval: PACIFICA_DEFAULT_INTERVAL,
				startTimeMs: startMs,
				endTimeMs: endMs,
				authorization: auth || undefined
			})
		]);

		candlesticks = mergeWeightedCandles(rawA, rawB, allocationA, allocationB);
		pacificaFeed = {
			wsUrl,
			pacificaSymbolA,
			pacificaSymbolB,
			legA: rawA,
			legB: rawB
		};
	} catch (e) {
		chartError = e instanceof Error ? e.message : 'Could not load market candles';
	}

	const signal: SignalDetailViewModel = {
		slug: params.slug,
		generatedAt: new Date('2025-03-18T14:30:00.000Z').toISOString(),
		tokenA,
		allocationA,
		tokenB,
		allocationB,
		entryPrice: 2847.32,
		description:
			'This signal suggests a weighted exposure between the two assets based on the shown allocation. ' +
			'Review the chart and entry level before opening a position. Chart shows a weighted price ratio from Pacifica (1h); long leg uses a positive exponent, short leg a negative exponent.',
		candlesticks,
		chartError
	};

	return { signal, pacificaFeed };
};
