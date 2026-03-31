import type { NewsApiSymbolRow, NewsSummaryItem } from './news-api.types.js';

const DEFAULT_TEASER_MAX = 160;

/**
 * First sentence (split on ". " / "? " / "! ") with a character cap and ellipsis fallback.
 */
export function teaserOneSentence(text: string, maxLen = DEFAULT_TEASER_MAX): string {
	const t = text.trim();
	if (!t) return '';
	const boundary = t.search(/[.!?]\s/);
	const sentence = boundary >= 0 ? t.slice(0, boundary + 1).trim() : t;
	if (sentence.length > maxLen) {
		const cut = sentence.slice(0, maxLen - 1).trimEnd();
		return `${cut}…`;
	}
	return sentence;
}

/** Case-insensitive symbol → ordered summary items (only symbols with at least one summary). */
export function buildNewsBySymbol(rows: NewsApiSymbolRow[]): Record<string, NewsSummaryItem[]> {
	const out: Record<string, NewsSummaryItem[]> = {};
	for (const row of rows) {
		if (typeof row.symbol !== 'string') continue;
		const key = row.symbol.trim().toUpperCase();
		if (!key) continue;
		const elfa = row.elfa;
		if (!elfa?.success || !Array.isArray(elfa.data)) continue;
		const items: NewsSummaryItem[] = [];
		for (const d of elfa.data) {
			if (typeof d.summary !== 'string') continue;
			const summary = d.summary.trim();
			if (!summary) continue;
			const sourceLinks = Array.isArray(d.sourceLinks)
				? d.sourceLinks.filter((x): x is string => typeof x === 'string' && x.length > 0)
				: [];
			items.push({ summary, sourceLinks });
		}
		if (items.length > 0) out[key] = items;
	}
	return out;
}
