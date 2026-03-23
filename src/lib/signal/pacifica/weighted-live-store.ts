import type { SignalCandlestickPoint } from '../signal-detail.types.js';
import type { PacificaCandle } from './types.js';
import {
	mergeLegMapsToPoints,
	pacificaCandleToLegRow,
	pacificaCandlesToLegMap
} from './weighted-merge.js';

/** Keeps two leg maps in sync with WS and produces merged weighted candles. */
export class WeightedCandleLiveStore {
	private readonly legA = new Map<number, { o: number; h: number; l: number; c: number }>();
	private readonly legB = new Map<number, { o: number; h: number; l: number; c: number }>();

	constructor(
		private readonly allocationA: number,
		private readonly allocationB: number,
		private readonly pacificaSymbolA: string,
		private readonly pacificaSymbolB: string
	) {}

	seedFromRest(candlesA: PacificaCandle[], candlesB: PacificaCandle[]): void {
		this.legA.clear();
		this.legB.clear();
		for (const [t, row] of pacificaCandlesToLegMap(candlesA)) this.legA.set(t, row);
		for (const [t, row] of pacificaCandlesToLegMap(candlesB)) this.legB.set(t, row);
	}

	applyWsCandle(candle: PacificaCandle): void {
		const row = pacificaCandleToLegRow(candle);
		if (!row) return;
		const sym = candle.s?.toUpperCase();
		if (sym === this.pacificaSymbolA) {
			this.legA.set(row.t, { o: row.o, h: row.h, l: row.l, c: row.c });
		} else if (sym === this.pacificaSymbolB) {
			this.legB.set(row.t, { o: row.o, h: row.h, l: row.l, c: row.c });
		}
	}

	getPoints(): SignalCandlestickPoint[] {
		return mergeLegMapsToPoints(this.legA, this.legB, this.allocationA, this.allocationB);
	}
}
