/** One summarized story from the news API (Elfa bundle). */
export interface NewsApiSummaryItem {
	summary: string;
	sourceLinks?: string[];
	tweetIds?: string[];
}

export interface NewsApiElfaBlock {
	success?: boolean;
	data?: NewsApiSummaryItem[];
	metadata?: Record<string, unknown>;
}

/** One symbol row in GET /news `data` array. */
export interface NewsApiSymbolRow {
	symbol: string;
	last_updated?: string;
	elfa?: NewsApiElfaBlock;
}

export interface NewsApiResponse {
	data?: NewsApiSymbolRow[];
	meta?: Record<string, unknown>;
}

/** Normalized item for UI and JSON serialization from load(). */
export interface NewsSummaryItem {
	summary: string;
	sourceLinks: string[];
}
