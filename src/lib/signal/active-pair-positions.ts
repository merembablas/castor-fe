const STORAGE_KEY = 'castor:activePairPositions';

export interface ActivePairPosition {
	slug: string;
	openedAt: number;
}

function safeParse(raw: string | null): ActivePairPosition[] {
	if (!raw) return [];
	try {
		const v = JSON.parse(raw) as unknown;
		if (!Array.isArray(v)) return [];
		const out: ActivePairPosition[] = [];
		for (const item of v) {
			if (!item || typeof item !== 'object') continue;
			const slug = (item as { slug?: unknown }).slug;
			const openedAt = (item as { openedAt?: unknown }).openedAt;
			if (typeof slug !== 'string' || !slug.trim()) continue;
			if (typeof openedAt !== 'number' || !Number.isFinite(openedAt)) continue;
			out.push({ slug: slug.trim(), openedAt });
		}
		return out;
	} catch {
		return [];
	}
}

export function readActivePairPositions(): ActivePairPosition[] {
	if (typeof localStorage === 'undefined') return [];
	return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function isSlugActive(slug: string): boolean {
	const s = slug.trim();
	if (!s) return false;
	return readActivePairPositions().some((e) => e.slug === s);
}

export function appendActivePairPosition(slug: string): void {
	if (typeof localStorage === 'undefined') return;
	const s = slug.trim();
	if (!s) return;
	const list = readActivePairPositions();
	if (list.some((e) => e.slug === s)) return;
	list.push({ slug: s, openedAt: Date.now() });
	localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** Replace the full list (e.g. after reconciling with Pacifica). */
export function writeActivePairPositions(list: ActivePairPosition[]): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** Remove one slug from storage; other entries unchanged. */
export function removeActivePairPosition(slug: string): void {
	if (typeof localStorage === 'undefined') return;
	const s = slug.trim();
	if (!s) return;
	const list = readActivePairPositions().filter((e) => e.slug.trim() !== s);
	localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
