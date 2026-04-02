import type { PacificaPositionRow } from '$lib/signal/pacifica/rest-types.js';

/** Parsed Pacifica position row for P&L: absolute base quantity with explicit side. */
export interface NormalizedLegPosition {
	symbol: string;
	side: 'bid' | 'ask';
	/** Absolute base-asset size (matches order `amount` semantics). */
	qtyBase: number;
	entryPrice: number;
}

/**
 * Maps REST `positions` rows to P&L inputs.
 * - `side`: Pacifica uses `bid` for long, `ask` for short (same as `create_market_order`).
 * - `amount` / `entry_price`: decimal strings from API.
 */
export function normalizePacificaPositionRow(row: PacificaPositionRow): NormalizedLegPosition | null {
	const rawSide = row.side?.trim().toLowerCase();
	if (rawSide !== 'bid' && rawSide !== 'ask') return null;

	const qty = Number.parseFloat(String(row.amount ?? '').trim());
	const entry = Number.parseFloat(String(row.entry_price ?? '').trim());
	if (!Number.isFinite(qty) || !Number.isFinite(entry) || !(entry > 0)) return null;
	if (Math.abs(qty) < 1e-12) return null;

	return {
		symbol: row.symbol.trim().toUpperCase(),
		side: rawSide,
		qtyBase: Math.abs(qty),
		entryPrice: entry
	};
}

/** First normalized row per symbol (Pacifica typically has one open position per symbol). */
export function positionsRowsToSymbolMap(
	rows: PacificaPositionRow[]
): Map<string, NormalizedLegPosition> {
	const map = new Map<string, NormalizedLegPosition>();
	for (const row of rows) {
		const n = normalizePacificaPositionRow(row);
		if (!n) continue;
		if (!map.has(n.symbol)) map.set(n.symbol, n);
	}
	return map;
}
