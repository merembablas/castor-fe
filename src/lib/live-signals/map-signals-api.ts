import { dedupeSignalsBySlugNewest } from '$lib/signal/dedupe-signals-by-slug-newest.js';
import { parseSignalSlug } from '$lib/signal/parse-signal-slug.js';
import type { LiveSignal } from './live-signals.js';
import type { SignalsApiRow } from './signals-api.types.js';
import { formatSignalMetricValue } from './signal-metric-format.js';

function allocationForSymbol(row: SignalsApiRow, symbol: string): number | null {
	if (row.symbol_a === symbol) return row.alloc_a_pct;
	if (row.symbol_b === symbol) return row.alloc_b_pct;
	return null;
}

/** Single-line copy for the list: Z-score and SNR with ≤2 decimal places and short explanations. */
export function buildSignalMetricsDescription(zScore: number, snr: number): string {
	const z = formatSignalMetricValue(zScore);
	const s = formatSignalMetricValue(snr);
	return (
		`Z-score ${z} — how far the spread is from its typical range. ` +
		`SNR ${s} — signal strength relative to noise.`
	);
}

export function mapSignalsApiRowToLiveSignal(row: SignalsApiRow): LiveSignal | null {
	const longToken = row.token_long.trim();
	const shortToken = row.token_short.trim();
	if (!longToken || !shortToken) return null;

	const longRaw = allocationForSymbol(row, longToken);
	const shortRaw = allocationForSymbol(row, shortToken);
	if (longRaw === null || shortRaw === null) return null;

	const allocationA = Math.round(longRaw);
	const allocationB = Math.round(shortRaw);
	const slug = `${longToken}:${allocationA}-${shortToken}:${allocationB}`;

	if (parseSignalSlug(slug).ok !== true) return null;

	return {
		slug,
		tokenALabel: longToken,
		tokenBLabel: shortToken,
		allocationA,
		allocationB,
		generatedAt: row.datetime_signal_occurred,
		description: buildSignalMetricsDescription(row.z_score, row.snr),
		zScore: row.z_score,
		snr: row.snr
	};
}

export function mapSignalsApiRows(rows: SignalsApiRow[]): LiveSignal[] {
	const out: LiveSignal[] = [];
	for (const row of rows) {
		const mapped = mapSignalsApiRowToLiveSignal(row);
		if (mapped) out.push(mapped);
	}
	return dedupeSignalsBySlugNewest(out, (s) => s.generatedAt);
}
