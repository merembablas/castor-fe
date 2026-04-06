function timeKey(iso: string): number {
	const t = Date.parse(iso);
	return Number.isFinite(t) ? t : Number.NEGATIVE_INFINITY;
}

/**
 * When the same `slug` appears multiple times, keeps only the newest row by `getTime` (ISO strings).
 * Older duplicates are dropped. Original order is preserved for the rows that remain.
 */
export function dedupeSignalsBySlugNewest<T extends { slug: string }>(
	items: T[],
	getTime: (item: T) => string
): T[] {
	const newestBySlug = new Map<string, T>();
	for (const item of items) {
		const cur = newestBySlug.get(item.slug);
		if (!cur || timeKey(getTime(item)) > timeKey(getTime(cur))) {
			newestBySlug.set(item.slug, item);
		}
	}
	return items.filter((item) => item === newestBySlug.get(item.slug));
}
