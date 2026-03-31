import type { NewsApiResponse, NewsApiSymbolRow, NewsSummaryItem } from './news-api.types.js';
import { buildNewsBySymbol } from './normalize-news.js';

const NGROK_SKIP_WARNING = 'ngrok-skip-browser-warning';

function isRecord(val: unknown): val is Record<string, unknown> {
	return typeof val === 'object' && val !== null;
}

function isSymbolRow(val: unknown): val is NewsApiSymbolRow {
	if (!isRecord(val)) return false;
	return typeof val.symbol === 'string';
}

function parseNewsResponse(json: unknown): NewsApiResponse | null {
	if (!isRecord(json)) return null;
	if (!Array.isArray(json.data)) return null;
	const data = json.data.filter(isSymbolRow);
	return { data, ...(isRecord(json.meta) ? { meta: json.meta } : {}) };
}

export type FetchNewsResult =
	| { ok: true; bySymbol: Record<string, NewsSummaryItem[]> }
	| { ok: false; error: string };

/**
 * Server-only GET of the news JSON API. Sends ngrok-free bypass header when calling tunnel hosts.
 */
export async function fetchNewsList(url: string): Promise<FetchNewsResult> {
	let parsedUrl: URL;
	try {
		parsedUrl = new URL(url);
	} catch {
		return { ok: false, error: 'Invalid news API URL' };
	}

	const headers: Record<string, string> = { Accept: 'application/json' };
	if (parsedUrl.hostname.endsWith('.ngrok-free.app') || parsedUrl.hostname.endsWith('.ngrok.io')) {
		headers[NGROK_SKIP_WARNING] = 'true';
	}

	try {
		const res = await fetch(url, { headers });
		if (!res.ok) {
			return { ok: false, error: `News API returned HTTP ${res.status}` };
		}
		const json: unknown = await res.json();
		const body = parseNewsResponse(json);
		if (!body?.data) {
			return { ok: false, error: 'News API response was not valid JSON' };
		}
		return { ok: true, bySymbol: buildNewsBySymbol(body.data) };
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Could not reach news API';
		return { ok: false, error: msg };
	}
}
