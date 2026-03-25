/** JSON shape from the signals list HTTP API. */

export interface SignalsApiMeta {
	generated_at: string;
	source?: string;
	source_present?: boolean;
}

export interface SignalsApiRow {
	z_score: number;
	snr: number;
	token_long: string;
	token_short: string;
	symbol_a: string;
	symbol_b: string;
	alloc_a_pct: number;
	alloc_b_pct: number;
	datetime_signal_occurred: string;
}

export interface SignalsApiResponse {
	data: SignalsApiRow[];
	meta: SignalsApiMeta;
}
