/** JSON shape from the archives list HTTP API. */

export interface ArchivesApiMeta {
	generated_at: string;
	source?: string;
	source_present?: boolean;
}

export interface ArchivesApiRow {
	/** Optional; present when API includes start-of-signal metrics */
	z_score_start?: number;
	snr_start?: number;
	z_score_end: number;
	snr_end: number;
	token_long: string;
	token_short: string;
	symbol_a: string;
	symbol_b: string;
	alloc_a_pct: number;
	alloc_b_pct: number;
	datetime_signal_occurred: string;
	datetime_signal_archived: string;
}

export interface ArchivesApiResponse {
	data: ArchivesApiRow[];
	meta: ArchivesApiMeta;
}
