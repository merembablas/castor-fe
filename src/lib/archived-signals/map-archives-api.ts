import { dedupeSignalsBySlugNewest } from '$lib/signal/dedupe-signals-by-slug-newest.js';
import { parseSignalSlug } from '$lib/signal/parse-signal-slug.js';
import type { ArchivedSignal } from './archived-signal.js';
import type { ArchivesApiRow } from './archives-api.types.js';

const metricFormatter = new Intl.NumberFormat(undefined, {
	minimumFractionDigits: 0,
	maximumFractionDigits: 2
});

function allocationForSymbol(row: ArchivesApiRow, symbol: string): number | null {
	if (row.symbol_a === symbol) return row.alloc_a_pct;
	if (row.symbol_b === symbol) return row.alloc_b_pct;
	return null;
}

/** Z-score (end) and SNR (end) with ≤2 decimals and short explanations for archived rows. */
export function buildArchivedMetricsDescription(zScoreEnd: number, snrEnd: number): string {
	const z = metricFormatter.format(zScoreEnd);
	const s = metricFormatter.format(snrEnd);
	return (
		`Z-score (end) ${z} — spread level when the signal was archived. ` +
		`SNR (end) ${s} — signal strength relative to noise at archive time.`
	);
}

export function mapArchivesApiRowToArchivedSignal(row: ArchivesApiRow): ArchivedSignal | null {
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
		archivedAt: row.datetime_signal_archived,
		description: buildArchivedMetricsDescription(row.z_score_end, row.snr_end)
	};
}

export function mapArchivesApiRows(rows: ArchivesApiRow[]): ArchivedSignal[] {
	const out: ArchivedSignal[] = [];
	for (const row of rows) {
		const mapped = mapArchivesApiRowToArchivedSignal(row);
		if (mapped) out.push(mapped);
	}
	return dedupeSignalsBySlugNewest(out, (s) => s.archivedAt);
}
