import { beforeEach, describe, expect, it } from 'bun:test';
import type { MergedPairPositionRow } from './active-pairs-positions-merge.js';
import {
	appendHistoricalClosedPairPosition,
	buildHistoricalClosedPairPositionInput,
	displayTokenLabelsForHistoricalPair,
	fundingPaidForegroundClass,
	HISTORICAL_PAIR_POSITIONS_MAX,
	parseHistoricalPairPositionsJson,
	readHistoricalClosedPairPositions,
	sortHistoricalClosedPairPositionsNewestFirst
} from './historical-pair-positions.js';

function memoryLocalStorage(): Storage {
	const m = new Map<string, string>();
	return {
		getItem: (k: string) => m.get(k) ?? null,
		setItem: (k: string, v: string) => {
			m.set(k, v);
		},
		removeItem: (k: string) => {
			m.delete(k);
		},
		clear: () => {
			m.clear();
		},
		key: (i: number) => [...m.keys()][i] ?? null,
		get length() {
			return m.size;
		}
	} as Storage;
}

beforeEach(() => {
	globalThis.localStorage = memoryLocalStorage();
});

describe('parseHistoricalPairPositionsJson', () => {
	it('returns [] for null, invalid JSON, or wrong shape', () => {
		expect(parseHistoricalPairPositionsJson(null)).toEqual([]);
		expect(parseHistoricalPairPositionsJson('')).toEqual([]);
		expect(parseHistoricalPairPositionsJson('not json')).toEqual([]);
		expect(parseHistoricalPairPositionsJson('{}')).toEqual([]);
		expect(parseHistoricalPairPositionsJson('{"schemaVersion":1}')).toEqual([]);
	});

	it('parses v1 wrapper with valid records', () => {
		const raw = JSON.stringify({
			schemaVersion: 1,
			records: [
				{
					id: 'a',
					slug: 's',
					longSymbol: 'L',
					shortSymbol: 'S',
					longAllocationPercent: 50,
					shortAllocationPercent: 50,
					openedAt: 1,
					closedAt: 2,
					realizedPnlUsd: 3,
					fundingPaidUsd: 4
				}
			]
		});
		expect(parseHistoricalPairPositionsJson(raw)).toHaveLength(1);
	});

	it('filters invalid array entries', () => {
		const raw = JSON.stringify({
			schemaVersion: 1,
			records: [{ id: 'x' }, null, 'bad']
		});
		expect(parseHistoricalPairPositionsJson(raw)).toEqual([]);
	});
});

describe('appendHistoricalClosedPairPosition', () => {
	it('roundtrips through localStorage', () => {
		const ok = appendHistoricalClosedPairPosition({
			slug: 'pair-slug',
			longSymbol: 'AAA',
			shortSymbol: 'BBB',
			longAllocationPercent: 60,
			shortAllocationPercent: 40,
			openedAt: 100,
			closedAt: 200,
			realizedPnlUsd: 1.5,
			fundingPaidUsd: -0.25
		});
		expect(ok).toBe(true);
		const list = readHistoricalClosedPairPositions();
		expect(list).toHaveLength(1);
		expect(list[0].slug).toBe('pair-slug');
		expect(list[0].id.length).toBeGreaterThan(0);
	});

	it('drops oldest when over max', () => {
		const n = HISTORICAL_PAIR_POSITIONS_MAX + 5;
		for (let i = 0; i < n; i++) {
			appendHistoricalClosedPairPosition({
				slug: `s-${i}`,
				longSymbol: 'L',
				shortSymbol: 'S',
				longAllocationPercent: 50,
				shortAllocationPercent: 50,
				openedAt: i,
				closedAt: i,
				realizedPnlUsd: 0,
				fundingPaidUsd: 0,
				id: `id-${i}`
			});
		}
		const list = readHistoricalClosedPairPositions();
		expect(list.length).toBe(HISTORICAL_PAIR_POSITIONS_MAX);
		expect(list[0].id).toBe(`id-${5}`);
		expect(list[list.length - 1].id).toBe(`id-${n - 1}`);
	});

	it('returns false on setItem throw without throwing', () => {
		const ls = globalThis.localStorage;
		const orig = ls.setItem.bind(ls);
		ls.setItem = () => {
			throw new Error('quota');
		};
		const ok = appendHistoricalClosedPairPosition({
			slug: 'x',
			longSymbol: 'L',
			shortSymbol: 'S',
			longAllocationPercent: 50,
			shortAllocationPercent: 50,
			openedAt: 1,
			closedAt: 2,
			realizedPnlUsd: 0,
			fundingPaidUsd: 0
		});
		expect(ok).toBe(false);
		ls.setItem = orig;
	});
});

describe('buildHistoricalClosedPairPositionInput', () => {
	const baseRow = {
		slug: 'sig',
		openedAt: 10,
		tokenALabel: 'A',
		tokenBLabel: 'B',
		symA: 'SYM_A',
		symB: 'SYM_B',
		allocationA: 55,
		allocationB: 45,
		legA: {
			symbol: 'SYM_A',
			side: 'bid' as const,
			qtyBase: 1,
			entryPrice: 100,
			amountRaw: '1',
			fundingPaid: -0.1
		},
		legB: {
			symbol: 'SYM_B',
			side: 'ask' as const,
			qtyBase: 1,
			entryPrice: 50,
			amountRaw: '1',
			fundingPaid: -0.2
		}
	} satisfies MergedPairPositionRow;

	it('returns null for empty slug', () => {
		expect(buildHistoricalClosedPairPositionInput({ ...baseRow, slug: '  ' }, {}, 99)).toBeNull();
	});

	it('maps marks to realized USD', () => {
		const input = buildHistoricalClosedPairPositionInput(baseRow, { SYM_A: 110, SYM_B: 45 }, 999);
		expect(input).not.toBeNull();
		expect(input!.fundingPaidUsd).toBeCloseTo(-0.3);
		expect(input!.closedAt).toBe(999);
		expect(input!.longSymbol).toBe('SYM_A');
		expect(input!.shortSymbol).toBe('SYM_B');
	});
});

describe('sortHistoricalClosedPairPositionsNewestFirst', () => {
	it('orders by closedAt descending', () => {
		const sorted = sortHistoricalClosedPairPositionsNewestFirst([
			{
				id: 'a',
				slug: 'X:50-Y:50',
				longSymbol: 'L',
				shortSymbol: 'S',
				longAllocationPercent: 50,
				shortAllocationPercent: 50,
				openedAt: 1,
				closedAt: 100,
				realizedPnlUsd: 0,
				fundingPaidUsd: 0
			},
			{
				id: 'b',
				slug: 'X:50-Y:50',
				longSymbol: 'L',
				shortSymbol: 'S',
				longAllocationPercent: 50,
				shortAllocationPercent: 50,
				openedAt: 1,
				closedAt: 300,
				realizedPnlUsd: 0,
				fundingPaidUsd: 0
			},
			{
				id: 'c',
				slug: 'X:50-Y:50',
				longSymbol: 'L',
				shortSymbol: 'S',
				longAllocationPercent: 50,
				shortAllocationPercent: 50,
				openedAt: 1,
				closedAt: 200,
				realizedPnlUsd: 0,
				fundingPaidUsd: 0
			}
		]);
		expect(sorted.map((r) => r.id)).toEqual(['b', 'c', 'a']);
	});
});

describe('displayTokenLabelsForHistoricalPair', () => {
	it('uses slug tokens when slug parses', () => {
		expect(
			displayTokenLabelsForHistoricalPair({
				slug: 'SOL:60-ETH:40',
				longSymbol: 'IGNORE',
				shortSymbol: 'IGNORE'
			})
		).toEqual({ tokenALabel: 'SOL', tokenBLabel: 'ETH' });
	});

	it('falls back to symbols when slug does not parse', () => {
		expect(
			displayTokenLabelsForHistoricalPair({
				slug: 'not-a-slug',
				longSymbol: 'AAA',
				shortSymbol: 'BBB'
			})
		).toEqual({ tokenALabel: 'AAA', tokenBLabel: 'BBB' });
	});
});

describe('fundingPaidForegroundClass', () => {
	it('maps sign to tone classes', () => {
		expect(fundingPaidForegroundClass(1)).toBe('text-emerald-600');
		expect(fundingPaidForegroundClass(-0.01)).toBe('text-red-600');
		expect(fundingPaidForegroundClass(0)).toBe('text-[#527E88]');
	});
});
