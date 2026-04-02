import { parseSignalSlug } from '$lib/signal/parse-signal-slug.js';
import { toPacificaSymbol } from '$lib/signal/pacifica/symbol.js';
import type { ActivePairPosition } from '$lib/signal/active-pair-positions.js';
import type { NormalizedLegPosition } from './pacifica-position-normalize.js';

export interface ResolvedActiveSlug {
	slug: string;
	openedAt: number;
	tokenALabel: string;
	tokenBLabel: string;
	symA: string;
	symB: string;
	allocationA: number;
	allocationB: number;
}

export function resolveActiveSlug(entry: ActivePairPosition): ResolvedActiveSlug | null {
	const parsed = parseSignalSlug(entry.slug);
	if (!parsed.ok) return null;
	const { tokenA, tokenB, allocationA, allocationB } = parsed.value;
	return {
		slug: entry.slug.trim(),
		openedAt: entry.openedAt,
		tokenALabel: tokenA,
		tokenBLabel: tokenB,
		symA: toPacificaSymbol(tokenA),
		symB: toPacificaSymbol(tokenB),
		allocationA,
		allocationB
	};
}

export interface MergedPairPositionRow extends ResolvedActiveSlug {
	legA: NormalizedLegPosition;
	legB: NormalizedLegPosition;
}

/**
 * Keeps only slugs that parse and have both Pacifica legs. Returns reconciled storage list + display rows.
 */
export function mergeActivePairsWithPacificaPositions(
	stored: ActivePairPosition[],
	positionBySymbol: Map<string, NormalizedLegPosition>
): { reconciledStored: ActivePairPosition[]; rows: MergedPairPositionRow[] } {
	const reconciledStored: ActivePairPosition[] = [];
	const rows: MergedPairPositionRow[] = [];

	for (const entry of stored) {
		const r = resolveActiveSlug(entry);
		if (!r) continue;

		const legA = positionBySymbol.get(r.symA);
		const legB = positionBySymbol.get(r.symB);
		if (!legA || !legB) continue;

		reconciledStored.push(entry);
		rows.push({ ...r, legA, legB });
	}

	return { reconciledStored, rows };
}
