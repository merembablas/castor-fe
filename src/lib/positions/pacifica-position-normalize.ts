import type { PacificaPositionRow } from '$lib/signal/pacifica/rest-types.js';

function parseFundingPaid(raw: unknown): number {
	const s = String(raw ?? '').trim();
	if (!s) return 0;
	const n = Number.parseFloat(s);
	return Number.isFinite(n) ? n : 0;
}

/** Parsed Pacifica position row for P&L: absolute base quantity with explicit side. */
export interface NormalizedLegPosition {
	symbol: string;
	side: 'bid' | 'ask';
	/** Absolute base-asset size (matches order `amount` semantics). */
	qtyBase: number;
	entryPrice: number;
	/** Trimmed REST `amount` string; preferred for reduce-only close orders. */
	amountRaw: string;
	/** Cumulative funding paid for this leg since open (REST `funding` decimal string). */
	fundingPaid: number;
}

/**
 * Maps REST `positions` rows to P&L inputs.
 * - `side`: Pacifica uses `bid` for long, `ask` for short (same as `create_market_order`).
 * - `amount` / `entry_price`: decimal strings from API.
 */
export function normalizePacificaPositionRow(row: PacificaPositionRow): NormalizedLegPosition | null {
	const rawSide = row.side?.trim().toLowerCase();
	if (rawSide !== 'bid' && rawSide !== 'ask') return null;

	const amountRaw = String(row.amount ?? '').trim();
	const qty = Number.parseFloat(amountRaw);
	const entry = Number.parseFloat(String(row.entry_price ?? '').trim());
	if (!Number.isFinite(qty) || !Number.isFinite(entry) || !(entry > 0)) return null;
	if (Math.abs(qty) < 1e-12) return null;

	return {
		symbol: row.symbol.trim().toUpperCase(),
		side: rawSide,
		qtyBase: Math.abs(qty),
		entryPrice: entry,
		amountRaw: amountRaw || String(Math.abs(qty)),
		fundingPaid: parseFundingPaid(row.funding)
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
