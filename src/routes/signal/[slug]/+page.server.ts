import { error } from '@sveltejs/kit';
import { parseSignalSlug } from '$lib/signal/parse-signal-slug.js';
import { buildStubCandlesticks } from '$lib/signal/stub-candlesticks.js';
import type { SignalDetailViewModel } from '$lib/signal/signal-detail.types.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const parsed = parseSignalSlug(params.slug);
	if (!parsed.ok) {
		error(404, 'Signal not found');
	}

	const { tokenA, allocationA, tokenB, allocationB } = parsed.value;

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
			'Review the chart and entry level before opening a position. Data shown is illustrative until connected to a live feed.',
		candlesticks: buildStubCandlesticks()
	};

	return { signal };
};
