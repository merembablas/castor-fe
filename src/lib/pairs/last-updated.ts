import type { PairsApiRow, PairsMeta } from './types.js';

/** Latest leg `updated_at`, else `meta.generated_at`, else first leg timestamp string. */
export function pairLastUpdatedIso(row: PairsApiRow, meta?: PairsMeta | null): string {
	const candidates = [row.market_a.updated_at, row.market_b.updated_at];
	let best = -Infinity;
	let bestStr = '';
	for (const c of candidates) {
		const t = new Date(c).getTime();
		if (!Number.isNaN(t) && t >= best) {
			best = t;
			bestStr = c;
		}
	}
	if (bestStr) return bestStr;
	if (meta?.generated_at) return meta.generated_at;
	return row.market_a.updated_at;
}
