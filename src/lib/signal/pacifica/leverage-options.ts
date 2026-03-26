/**
 * Leverage UI options for signal detail (OpenSpec: 5x steps, append max if off-grid, below 5x → single max).
 */
export function effectiveMaxLeverage(maxA: number, maxB: number): number {
	const a = Number.isFinite(maxA) ? Math.floor(maxA) : 0;
	const b = Number.isFinite(maxB) ? Math.floor(maxB) : 0;
	return Math.min(a, b);
}

export function buildLeverageOptions(effectiveMax: number): number[] {
	const m = Math.floor(effectiveMax);
	if (m < 1) return [];
	if (m < 5) return [m];

	const out: number[] = [];
	for (let x = 5; x <= m; x += 5) {
		out.push(x);
	}
	const last = out[out.length - 1];
	if (last !== m) {
		out.push(m);
	}
	return out;
}
