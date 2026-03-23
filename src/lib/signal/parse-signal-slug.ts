import type { ParsedSignalPair } from './signal-detail.types.js';

export type ParseSignalSlugResult =
	| { ok: true; value: ParsedSignalPair }
	| { ok: false; reason: string };

const SLUG_PATTERN = /^([A-Za-z0-9]+):(\d{1,3})-([A-Za-z0-9]+):(\d{1,3})$/;

/**
 * Parses a `/signal/[slug]` segment: `TOKEN_A:ALLOC_A-TOKEN_B:ALLOC_B`.
 *
 * - Tokens: one or more ASCII letters or digits (`[A-Za-z0-9]+`).
 * - Allocations: integers in **0–100** (parsed from 1–3 digit groups, then range-checked).
 */
export function parseSignalSlug(slug: string): ParseSignalSlugResult {
	const trimmed = slug.trim();
	const match = SLUG_PATTERN.exec(trimmed);
	if (!match) {
		return { ok: false, reason: 'Slug does not match TOKEN:ALLOC-TOKEN:ALLOC' };
	}

	const [, tokenA, allocAStr, tokenB, allocBStr] = match;
	const allocationA = Number(allocAStr);
	const allocationB = Number(allocBStr);

	if (!Number.isInteger(allocationA) || allocationA < 0 || allocationA > 100) {
		return { ok: false, reason: 'First allocation must be an integer from 0 to 100' };
	}
	if (!Number.isInteger(allocationB) || allocationB < 0 || allocationB > 100) {
		return { ok: false, reason: 'Second allocation must be an integer from 0 to 100' };
	}

	return {
		ok: true,
		value: { tokenA, allocationA, tokenB, allocationB }
	};
}
