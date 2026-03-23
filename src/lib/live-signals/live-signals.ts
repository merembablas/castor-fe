/** One row on the live feed; slug must match `/signal/[slug]` parser (e.g. `ETH:25-SOL:75`). */
export interface LiveSignal {
	slug: string;
	tokenALabel: string;
	tokenBLabel: string;
	allocationA: number;
	allocationB: number;
	/** ISO 8601 timestamp */
	generatedAt: string;
	description: string;
}

export const DUMMY_LIVE_SIGNALS: LiveSignal[] = [
	{
		slug: 'ETH:25-SOL:75',
		tokenALabel: 'ETH',
		tokenBLabel: 'SOL',
		allocationA: 25,
		allocationB: 75,
		generatedAt: '2026-03-23T08:15:00.000Z',
		description:
			'ETH long / SOL short basket — momentum fade after overnight squeeze; watch funding.'
	},
	{
		slug: 'BTC:40-AVAX:60',
		tokenALabel: 'BTC',
		tokenBLabel: 'AVAX',
		allocationA: 40,
		allocationB: 60,
		generatedAt: '2026-03-23T07:42:00.000Z',
		description: 'BTC long vs AVAX short — relative strength skew; tight risk on BTC leg.'
	},
	{
		slug: 'ARB:33-MATIC:67',
		tokenALabel: 'ARB',
		tokenBLabel: 'MATIC',
		allocationA: 33,
		allocationB: 67,
		generatedAt: '2026-03-23T06:05:00.000Z',
		description:
			'ARB long / MATIC short — L2 flow divergence; illustrative until live feed connects.'
	}
];
