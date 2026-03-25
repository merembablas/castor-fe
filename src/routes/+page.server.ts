import { env } from '$env/dynamic/public';
import { fetchSignalsList } from '$lib/live-signals/fetch-signals.server.js';
import type { LiveSignal } from '$lib/live-signals/live-signals.js';
import { mapSignalsApiRows } from '$lib/live-signals/map-signals-api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const url = env.PUBLIC_SIGNALS_API_URL?.trim();
	if (!url) {
		return {
			liveSignals: [] as LiveSignal[],
			liveSignalsError:
				'Set PUBLIC_SIGNALS_API_URL to your signals API (full URL including /signals).',
			liveSignalsConfigured: false,
			liveSignalsEmpty: false
		};
	}

	const result = await fetchSignalsList(url);
	if (!result.ok) {
		return {
			liveSignals: [] as LiveSignal[],
			liveSignalsError: result.error,
			liveSignalsConfigured: true,
			liveSignalsEmpty: false
		};
	}

	const liveSignals = mapSignalsApiRows(result.body.data);
	return {
		liveSignals,
		liveSignalsError: null as string | null,
		liveSignalsConfigured: true,
		liveSignalsEmpty: liveSignals.length === 0
	};
};
