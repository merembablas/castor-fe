/** Response shape from the pairs JSON API (`GET …/pairs`). */

export interface PairsMarketLeg {
	funding: string;
	next_funding: string;
	updated_at: string;
	categories: string[];
}

export interface PairsApiRow {
	symbol_a: string;
	symbol_b: string;
	coint_coefficient: number;
	adf_statistic: number;
	adf_p_value: number;
	zero_crossings: number;
	mean_crossing_time: number;
	market_a: PairsMarketLeg;
	market_b: PairsMarketLeg;
	distance_measure?: number;
	coint_premium?: number;
	snr?: number;
	avg_max_zscore?: number;
	max_zscore?: number;
}

export interface PairsMeta {
	generated_at?: string;
	source?: string;
	source_present?: boolean;
	prices_source_present?: boolean;
	categories_source_present?: boolean;
}

export interface PairsApiResponse {
	data: PairsApiRow[];
	meta?: PairsMeta;
}
