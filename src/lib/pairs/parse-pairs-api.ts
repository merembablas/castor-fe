import type { PairsApiResponse, PairsApiRow, PairsMarketLeg, PairsMeta } from './types.js';

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isMarketLeg(v: unknown): v is PairsMarketLeg {
	if (!isRecord(v)) return false;
	const cats = v.categories;
	return (
		typeof v.funding === 'string' &&
		typeof v.next_funding === 'string' &&
		typeof v.updated_at === 'string' &&
		Array.isArray(cats) &&
		cats.every((c) => typeof c === 'string')
	);
}

function isFiniteNumber(v: unknown): v is number {
	return typeof v === 'number' && Number.isFinite(v);
}

function isPairRow(v: unknown): v is PairsApiRow {
	if (!isRecord(v)) return false;
	return (
		typeof v.symbol_a === 'string' &&
		typeof v.symbol_b === 'string' &&
		isFiniteNumber(v.coint_coefficient) &&
		isFiniteNumber(v.adf_statistic) &&
		isFiniteNumber(v.adf_p_value) &&
		isFiniteNumber(v.zero_crossings) &&
		isFiniteNumber(v.mean_crossing_time) &&
		isMarketLeg(v.market_a) &&
		isMarketLeg(v.market_b)
	);
}

function parseMeta(v: unknown): PairsMeta | undefined {
	if (!isRecord(v)) return undefined;
	const meta: PairsMeta = {};
	if (typeof v.generated_at === 'string') meta.generated_at = v.generated_at;
	if (typeof v.source === 'string') meta.source = v.source;
	if (typeof v.source_present === 'boolean') meta.source_present = v.source_present;
	if (typeof v.prices_source_present === 'boolean')
		meta.prices_source_present = v.prices_source_present;
	if (typeof v.categories_source_present === 'boolean')
		meta.categories_source_present = v.categories_source_present;
	return Object.keys(meta).length ? meta : undefined;
}

/** Returns null if the payload is not a usable pairs response. */
export function parsePairsApiResponse(json: unknown): PairsApiResponse | null {
	if (!isRecord(json) || !Array.isArray(json.data)) return null;
	const data = json.data.filter(isPairRow);
	return {
		data,
		meta: parseMeta(json.meta)
	};
}
