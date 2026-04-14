import type { ArchivedSignal } from './archived-signal.js';

export const ARCHIVES_PAGE_SIZE = 5;

function archivedEndedTimeKey(iso: string): number {
	const t = Date.parse(iso);
	return Number.isFinite(t) ? t : Number.NEGATIVE_INFINITY;
}

/** Newest archived (ended) first — global order after dedupe. */
export function sortArchivedSignalsByEndedDesc(signals: ArchivedSignal[]): ArchivedSignal[] {
	return [...signals].sort(
		(a, b) => archivedEndedTimeKey(b.archivedAt) - archivedEndedTimeKey(a.archivedAt)
	);
}

/** 1-based page index from `?page=`; invalid or missing → 1. */
export function parseArchivesPageParam(searchParams: URLSearchParams): number {
	const raw = searchParams.get('page');
	if (raw == null || raw === '') return 1;
	const n = Number.parseInt(raw, 10);
	if (!Number.isFinite(n) || n < 1) return 1;
	return Math.floor(n);
}

export interface ArchivesPaginationResult {
	pageSignals: ArchivedSignal[];
	pageIndex: number;
	totalPages: number;
}

export function paginateArchivedSignals(
	sortedSignals: ArchivedSignal[],
	requestedPage: number
): ArchivesPaginationResult {
	const n = sortedSignals.length;
	if (n === 0) {
		return { pageSignals: [], pageIndex: 1, totalPages: 0 };
	}

	const totalPages = Math.ceil(n / ARCHIVES_PAGE_SIZE);
	const pageIndex = Math.min(Math.max(1, requestedPage), totalPages);
	const start = (pageIndex - 1) * ARCHIVES_PAGE_SIZE;
	const pageSignals = sortedSignals.slice(start, start + ARCHIVES_PAGE_SIZE);
	return { pageSignals, pageIndex, totalPages };
}
