import type { SignalCandlestickPoint } from '../signal-detail.types.js';
import type { PacificaCandle } from './types.js';

function parsePositivePrice(raw: string): number | null {
	const n = Number.parseFloat(raw);
	if (!Number.isFinite(n) || n <= 0) return null;
	return n;
}

function powPrice(price: number, weight: number): number {
	if (weight === 0) return 1;
	return Math.pow(price, weight);
}

function syntheticComponent(
	a: number | null,
	b: number | null,
	wA: number,
	wB: number
): number | null {
	if (a === null || b === null) return null;
	const v = powPrice(a, wA) * powPrice(b, wB);
	return Number.isFinite(v) ? v : null;
}

export function pacificaCandlesToLegMap(
	candles: PacificaCandle[]
): Map<number, { o: number; h: number; l: number; c: number }> {
	const map = new Map<number, { o: number; h: number; l: number; c: number }>();
	for (const c of candles) {
		const o = parsePositivePrice(c.o);
		const h = parsePositivePrice(c.h);
		const l = parsePositivePrice(c.l);
		const cl = parsePositivePrice(c.c);
		if (o === null || h === null || l === null || cl === null) continue;
		map.set(c.t, { o, h, l, c: cl });
	}
	return map;
}

/**
 * Merges two Pacifica candle lists by bar open time `t`.
 * Long leg (A): exponent allocationA/100. Short leg (B): exponent -allocationB/100.
 * Synthetic OHLC applies the same exponents independently to o,h,l,c (approximation).
 */
export function mergeWeightedCandles(
	candlesA: PacificaCandle[],
	candlesB: PacificaCandle[],
	allocationA: number,
	allocationB: number
): SignalCandlestickPoint[] {
	const wA = allocationA / 100;
	const wB = -allocationB / 100;

	const mapA = pacificaCandlesToLegMap(candlesA);
	const mapB = pacificaCandlesToLegMap(candlesB);

	const times: number[] = [];
	for (const t of mapA.keys()) {
		if (mapB.has(t)) times.push(t);
	}
	times.sort((a, b) => a - b);

	const out: SignalCandlestickPoint[] = [];
	for (const t of times) {
		const a = mapA.get(t);
		const b = mapB.get(t);
		if (!a || !b) continue;

		const open = syntheticComponent(a.o, b.o, wA, wB);
		const high = syntheticComponent(a.h, b.h, wA, wB);
		const low = syntheticComponent(a.l, b.l, wA, wB);
		const close = syntheticComponent(a.c, b.c, wA, wB);
		if (open === null || high === null || low === null || close === null) continue;

		out.push({
			time: Math.floor(t / 1000),
			open,
			high,
			low,
			close
		});
	}

	return out;
}

/**
 * Updates in-memory leg maps from one Pacifica candle message and returns merged series
 * for all timestamps where both legs exist (sorted).
 */
export function mergeLegMapsToPoints(
	legA: Map<number, { o: number; h: number; l: number; c: number }>,
	legB: Map<number, { o: number; h: number; l: number; c: number }>,
	allocationA: number,
	allocationB: number
): SignalCandlestickPoint[] {
	const wA = allocationA / 100;
	const wB = -allocationB / 100;

	const times: number[] = [];
	for (const t of legA.keys()) {
		if (legB.has(t)) times.push(t);
	}
	times.sort((a, b) => a - b);

	const out: SignalCandlestickPoint[] = [];
	for (const t of times) {
		const a = legA.get(t);
		const b = legB.get(t);
		if (!a || !b) continue;

		const open = syntheticComponent(a.o, b.o, wA, wB);
		const high = syntheticComponent(a.h, b.h, wA, wB);
		const low = syntheticComponent(a.l, b.l, wA, wB);
		const close = syntheticComponent(a.c, b.c, wA, wB);
		if (open === null || high === null || low === null || close === null) continue;

		out.push({
			time: Math.floor(t / 1000),
			open,
			high,
			low,
			close
		});
	}
	return out;
}

export function pacificaCandleToLegRow(c: PacificaCandle): {
	t: number;
	o: number;
	h: number;
	l: number;
	c: number;
} | null {
	const o = parsePositivePrice(c.o);
	const h = parsePositivePrice(c.h);
	const l = parsePositivePrice(c.l);
	const cl = parsePositivePrice(c.c);
	if (o === null || h === null || l === null || cl === null) return null;
	return { t: c.t, o, h, l, c: cl };
}
