import type { MergedPairPositionRow } from './active-pairs-positions-merge.js';
import { pairUnrealizedPnlUsd } from './positions-pnl.js';

export const HISTORICAL_PAIR_POSITIONS_STORAGE_KEY = 'castor:historicalPairPositions';

/** Stored document version; bump when shape changes. */
export const HISTORICAL_PAIR_POSITIONS_SCHEMA_VERSION = 1;

/** Max records retained (oldest dropped first). */
export const HISTORICAL_PAIR_POSITIONS_MAX = 200;

export interface HistoricalClosedPairPosition {
	id: string;
	slug: string;
	/** Pacifica symbol for long leg (token A). */
	longSymbol: string;
	/** Pacifica symbol for short leg (token B). */
	shortSymbol: string;
	longAllocationPercent: number;
	shortAllocationPercent: number;
	openedAt: number;
	closedAt: number;
	realizedPnlUsd: number;
	fundingPaidUsd: number;
}

interface StoredDocumentV1 {
	schemaVersion: 1;
	records: HistoricalClosedPairPosition[];
}

function isHistoricalRecord(v: unknown): v is HistoricalClosedPairPosition {
	if (!v || typeof v !== 'object') return false;
	const o = v as Record<string, unknown>;
	if (typeof o.id !== 'string' || !o.id.trim()) return false;
	if (typeof o.slug !== 'string' || !o.slug.trim()) return false;
	if (typeof o.longSymbol !== 'string' || !o.longSymbol.trim()) return false;
	if (typeof o.shortSymbol !== 'string' || !o.shortSymbol.trim()) return false;
	if (typeof o.longAllocationPercent !== 'number' || !Number.isFinite(o.longAllocationPercent))
		return false;
	if (typeof o.shortAllocationPercent !== 'number' || !Number.isFinite(o.shortAllocationPercent))
		return false;
	if (typeof o.openedAt !== 'number' || !Number.isFinite(o.openedAt)) return false;
	if (typeof o.closedAt !== 'number' || !Number.isFinite(o.closedAt)) return false;
	if (typeof o.realizedPnlUsd !== 'number' || !Number.isFinite(o.realizedPnlUsd)) return false;
	if (typeof o.fundingPaidUsd !== 'number' || !Number.isFinite(o.fundingPaidUsd)) return false;
	return true;
}

/** Parse raw localStorage value; exported for tests. */
export function parseHistoricalPairPositionsJson(
	raw: string | null
): HistoricalClosedPairPosition[] {
	if (!raw) return [];
	try {
		const v = JSON.parse(raw) as unknown;
		if (Array.isArray(v)) {
			const out: HistoricalClosedPairPosition[] = [];
			for (const item of v) {
				if (isHistoricalRecord(item)) out.push(item);
			}
			return out;
		}
		if (v && typeof v === 'object' && (v as StoredDocumentV1).schemaVersion === 1) {
			const recs = (v as StoredDocumentV1).records;
			if (!Array.isArray(recs)) return [];
			const out: HistoricalClosedPairPosition[] = [];
			for (const item of recs) {
				if (isHistoricalRecord(item)) out.push(item);
			}
			return out;
		}
		return [];
	} catch {
		return [];
	}
}

export function readHistoricalClosedPairPositions(): HistoricalClosedPairPosition[] {
	if (typeof localStorage === 'undefined') return [];
	return parseHistoricalPairPositionsJson(
		localStorage.getItem(HISTORICAL_PAIR_POSITIONS_STORAGE_KEY)
	);
}

function serializeDocument(records: HistoricalClosedPairPosition[]): string {
	const doc: StoredDocumentV1 = {
		schemaVersion: 1,
		records
	};
	return JSON.stringify(doc);
}

/**
 * Builds a persistable row from the last merged Pacifica snapshot (token A = long, token B = short).
 * Returns null if slug/symbols/times are unusable — caller skips append.
 *
 * Realized P&L uses the same leg + mark logic as the open row; if marks are missing, USD is 0 (pending).
 * Funding is the sum of both legs’ parsed REST `funding` (same as positions list).
 */
export function buildHistoricalClosedPairPositionInput(
	row: MergedPairPositionRow,
	marksBySymbol: Record<string, number>,
	closedAtMs: number
): Omit<HistoricalClosedPairPosition, 'id'> | null {
	const slug = row.slug?.trim();
	if (!slug) return null;
	const longSymbol = row.symA?.trim();
	const shortSymbol = row.symB?.trim();
	if (!longSymbol || !shortSymbol) return null;
	if (typeof row.openedAt !== 'number' || !Number.isFinite(row.openedAt)) return null;
	if (typeof closedAtMs !== 'number' || !Number.isFinite(closedAtMs)) return null;

	const markA = marksBySymbol[row.symA];
	const markB = marksBySymbol[row.symB];
	const { usd } = pairUnrealizedPnlUsd(row.legA, row.legB, markA, markB);
	const fundingPaidUsd = row.legA.fundingPaid + row.legB.fundingPaid;

	return {
		slug,
		longSymbol,
		shortSymbol,
		longAllocationPercent: row.allocationA,
		shortAllocationPercent: row.allocationB,
		openedAt: row.openedAt,
		closedAt: closedAtMs,
		realizedPnlUsd: usd,
		fundingPaidUsd
	};
}

/**
 * Appends one record (generates `id` if omitted). Enforces max length (drops oldest).
 * Returns false if storage is unavailable or write fails (quota, etc.); does not throw.
 */
export function appendHistoricalClosedPairPosition(
	record: Omit<HistoricalClosedPairPosition, 'id'> & { id?: string }
): boolean {
	if (typeof localStorage === 'undefined') return false;
	let id: string;
	try {
		id = record.id?.trim() || crypto.randomUUID();
	} catch {
		id = record.id?.trim() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
	}

	const full: HistoricalClosedPairPosition = {
		id,
		slug: record.slug,
		longSymbol: record.longSymbol,
		shortSymbol: record.shortSymbol,
		longAllocationPercent: record.longAllocationPercent,
		shortAllocationPercent: record.shortAllocationPercent,
		openedAt: record.openedAt,
		closedAt: record.closedAt,
		realizedPnlUsd: record.realizedPnlUsd,
		fundingPaidUsd: record.fundingPaidUsd
	};

	const existing = readHistoricalClosedPairPositions();
	const next = [...existing, full];
	const capped =
		next.length > HISTORICAL_PAIR_POSITIONS_MAX ? next.slice(-HISTORICAL_PAIR_POSITIONS_MAX) : next;

	try {
		localStorage.setItem(HISTORICAL_PAIR_POSITIONS_STORAGE_KEY, serializeDocument(capped));
		return true;
	} catch {
		return false;
	}
}

export function tryAppendHistoricalClosedPairFromMergedRow(
	row: MergedPairPositionRow,
	marksBySymbol: Record<string, number>,
	closedAtMs: number = Date.now()
): boolean {
	const input = buildHistoricalClosedPairPositionInput(row, marksBySymbol, closedAtMs);
	if (!input) return false;
	return appendHistoricalClosedPairPosition(input);
}
