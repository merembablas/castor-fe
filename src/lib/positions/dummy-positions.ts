/** One open pair position row; values are placeholders until API wiring. */
export interface OpenPosition {
	id: string;
	tokenALabel: string;
	tokenBLabel: string;
	allocationA: number;
	allocationB: number;
	/** ISO 8601 */
	generatedAt: string;
	/** ISO 8601 */
	openedAt: string;
	notionalUsd: number;
	unrealizedPnlUsd: number;
	unrealizedPnlPercent: number;
}

export const DUMMY_POSITIONS: OpenPosition[] = [
	{
		id: 'p1',
		tokenALabel: 'ETH',
		tokenBLabel: 'SOL',
		allocationA: 25,
		allocationB: 75,
		generatedAt: '2026-03-23T08:15:00.000Z',
		openedAt: '2026-03-23T08:20:00.000Z',
		notionalUsd: 5,
		unrealizedPnlUsd: 0.11,
		unrealizedPnlPercent: 2.1
	},
	{
		id: 'p2',
		tokenALabel: 'BTC',
		tokenBLabel: 'AVAX',
		allocationA: 40,
		allocationB: 60,
		generatedAt: '2026-03-23T07:42:00.000Z',
		openedAt: '2026-03-23T07:45:00.000Z',
		notionalUsd: 5,
		unrealizedPnlUsd: -0.08,
		unrealizedPnlPercent: -1.5
	},
	{
		id: 'p3',
		tokenALabel: 'ARB',
		tokenBLabel: 'MATIC',
		allocationA: 33,
		allocationB: 67,
		generatedAt: '2026-03-23T06:05:00.000Z',
		openedAt: '2026-03-23T06:10:00.000Z',
		notionalUsd: 5,
		unrealizedPnlUsd: 0.02,
		unrealizedPnlPercent: 0.4
	}
];
