import { env } from '$env/dynamic/private';
import { getPairsPayload } from '$lib/server/pairs-cache.js';
import type { PairsApiRow, PairsMeta } from '$lib/pairs/types.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const base = env.PAIRS_API_BASE_URL?.trim();
	if (!base) {
		return {
			pairs: [] as PairsApiRow[],
			pairsMeta: null as PairsMeta | null,
			pairsError:
				'Set PAIRS_API_BASE_URL to your pairs API origin (no trailing slash), e.g. https://xxxx.ngrok-free.app',
			pairsConfigured: false,
			pairsEmpty: false
		};
	}

	const result = await getPairsPayload(base);
	if (!result.ok) {
		return {
			pairs: [] as PairsApiRow[],
			pairsMeta: null as PairsMeta | null,
			pairsError: result.error,
			pairsConfigured: true,
			pairsEmpty: false
		};
	}

	return {
		pairs: result.rows,
		pairsMeta: result.meta ?? null,
		pairsError: null as string | null,
		pairsConfigured: true,
		pairsEmpty: result.rows.length === 0
	};
};
