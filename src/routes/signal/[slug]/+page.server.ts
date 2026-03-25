import { error } from '@sveltejs/kit';
import { env as publicEnv } from '$env/dynamic/public';
import { fetchSignalsList } from '$lib/live-signals/fetch-signals.server.js';
import {
	buildSignalMetricsDescription,
	mapSignalsApiRowToLiveSignal
} from '$lib/live-signals/map-signals-api.js';
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

const DESCRIPTION_FALLBACK =
	'Chart shows a weighted price ratio from Pacifica (1h); long leg uses a positive exponent, short leg a negative exponent.';

export const load: PageServerLoad = async ({ params, locals }) => {
	const parsed = parseSignalSlug(params.slug);
	if (!parsed.ok) {
		error(404, 'Signal not found');
	}

	let tokenA = parsed.value.tokenA;
	let allocationA = parsed.value.allocationA;
	let tokenB = parsed.value.tokenB;
	let allocationB = parsed.value.allocationB;

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

	let updatedAt: string | null = null;
	let signalsFeedNotice: string | null = null;
	let description = DESCRIPTION_FALLBACK;

	const signalsApiUrl = publicEnv.PUBLIC_SIGNALS_API_URL?.trim();
	if (signalsApiUrl) {
		const result = await fetchSignalsList(signalsApiUrl);
		if (!result.ok) {
			signalsFeedNotice = 'Could not load the active signals list.';
		} else {
			let matched = false;
			for (const row of result.body.data) {
				const live = mapSignalsApiRowToLiveSignal(row);
				if (live && live.slug === params.slug) {
					matched = true;
					tokenA = live.tokenALabel;
					allocationA = live.allocationA;
					tokenB = live.tokenBLabel;
					allocationB = live.allocationB;
					updatedAt = row.datetime_signal_occurred;
					description =
						buildSignalMetricsDescription(row.z_score, row.snr) +
						' Chart shows a weighted price ratio from Pacifica (1h).';
					break;
				}
			}
			if (!matched) {
				signalsFeedNotice = 'This signal is not in the current active list.';
			}
		}
	}

	const signal: SignalDetailViewModel = {
		slug: params.slug,
		updatedAt,
		signalsFeedNotice,
		tokenA,
		allocationA,
		tokenB,
		allocationB,
		description,
		candlesticks,
		chartError
	};

	return { signal, pacificaFeed };
};
