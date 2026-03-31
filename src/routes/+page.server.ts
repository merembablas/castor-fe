import { env } from '$env/dynamic/public';
import { fetchSignalsList } from '$lib/live-signals/fetch-signals.server.js';
import type { LiveSignal } from '$lib/live-signals/live-signals.js';
import { mapSignalsApiRows } from '$lib/live-signals/map-signals-api.js';
import { fetchNewsList } from '$lib/symbol-news/fetch-news.server.js';
import type { NewsSummaryItem } from '$lib/symbol-news/news-api.types.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const newsUrl = env.PUBLIC_NEWS_API_URL?.trim();
	let newsBySymbol: Record<string, NewsSummaryItem[]> = {};
	let newsFeedConfigured = false;
	let newsFeedError: string | null = null;

	if (newsUrl) {
		newsFeedConfigured = true;
		const newsResult = await fetchNewsList(newsUrl);
		if (newsResult.ok) {
			newsBySymbol = newsResult.bySymbol;
		} else {
			newsFeedError = newsResult.error;
		}
	}

	const url = env.PUBLIC_SIGNALS_API_URL?.trim();
	if (!url) {
		return {
			liveSignals: [] as LiveSignal[],
			liveSignalsError:
				'Set PUBLIC_SIGNALS_API_URL to your signals API (full URL including /signals).',
			liveSignalsConfigured: false,
			liveSignalsEmpty: false,
			newsBySymbol,
			newsFeedConfigured,
			newsFeedError
		};
	}

	const result = await fetchSignalsList(url);
	if (!result.ok) {
		return {
			liveSignals: [] as LiveSignal[],
			liveSignalsError: result.error,
			liveSignalsConfigured: true,
			liveSignalsEmpty: false,
			newsBySymbol,
			newsFeedConfigured,
			newsFeedError
		};
	}

	const liveSignals = mapSignalsApiRows(result.body.data);
	return {
		liveSignals,
		liveSignalsError: null as string | null,
		liveSignalsConfigured: true,
		liveSignalsEmpty: liveSignals.length === 0,
		newsBySymbol,
		newsFeedConfigured,
		newsFeedError
	};
};
