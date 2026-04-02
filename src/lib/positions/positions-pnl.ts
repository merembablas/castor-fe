import type { NormalizedLegPosition } from './pacifica-position-normalize.js';

/**
 * Unrealized P&L in USD for one linear leg.
 * Long (bid): qty * (mark - entry). Short (ask): qty * (entry - mark).
 */
export function legUnrealizedUsd(leg: NormalizedLegPosition, markUsd: number): number {
	if (!(markUsd > 0) || !(leg.entryPrice > 0)) return 0;
	if (leg.side === 'bid') {
		return leg.qtyBase * (markUsd - leg.entryPrice);
	}
	return leg.qtyBase * (leg.entryPrice - markUsd);
}

/**
 * Opening notional (USD) approximated as sum of |qty * entry| per leg (matches spot-style exposure at entry).
 * Used as denominator for unrealized P&L % on the positions list.
 */
export function pairOpeningNotionalUsd(legA: NormalizedLegPosition, legB: NormalizedLegPosition): number {
	const a = legA.qtyBase * legA.entryPrice;
	const b = legB.qtyBase * legB.entryPrice;
	const sum = a + b;
	return Number.isFinite(sum) && sum > 0 ? sum : 0;
}

export function pairUnrealizedPnlUsd(
	legA: NormalizedLegPosition,
	legB: NormalizedLegPosition,
	markA: number | null | undefined,
	markB: number | null | undefined
): { usd: number; pending: boolean } {
	if (markA == null || markB == null || !(markA > 0) || !(markB > 0)) {
		return { usd: 0, pending: true };
	}
	const usd = legUnrealizedUsd(legA, markA) + legUnrealizedUsd(legB, markB);
	return { usd, pending: false };
}

export function pairUnrealizedPnlPercent(
	unrealizedUsd: number,
	openingNotionalUsd: number,
	pnlPending: boolean
): number {
	if (pnlPending || !(openingNotionalUsd > 0)) return 0;
	return (unrealizedUsd / openingNotionalUsd) * 100;
}
