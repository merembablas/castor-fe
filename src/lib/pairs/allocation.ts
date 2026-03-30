/**
 * Hedge-style display weights from cointegration coefficient β:
 * pct_a = (100 * |β|) / (|β| + 1), pct_b = 100 / (|β| + 1).
 */
export interface AllocationDisplay {
	pctLong: number;
	pctShort: number;
}

export function allocationFromCointCoefficient(beta: number): AllocationDisplay {
	const abs = Math.abs(beta);
	const denom = abs + 1;
	const pctLong = (100 * abs) / denom;
	const pctShort = 100 / denom;
	return roundAllocationsToOneDecimal(pctLong, pctShort);
}

function roundAllocationsToOneDecimal(a: number, b: number): AllocationDisplay {
	const pctLong = Math.round(a * 10) / 10;
	let pctShort = Math.round(b * 10) / 10;
	const sum = pctLong + pctShort;
	if (Math.abs(sum - 100) > 0.01) {
		pctShort = Math.round((100 - pctLong) * 10) / 10;
	}
	return { pctLong, pctShort };
}
