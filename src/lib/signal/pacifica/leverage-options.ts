/** Effective max leverage for a pair: minimum of both symbols’ floored maxima. */
export function effectiveMaxLeverage(maxA: number, maxB: number): number {
	const a = Number.isFinite(maxA) ? Math.floor(maxA) : 0;
	const b = Number.isFinite(maxB) ? Math.floor(maxB) : 0;
	return Math.min(a, b);
}
