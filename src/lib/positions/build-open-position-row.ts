import type { MergedPairPositionRow } from './active-pairs-positions-merge.js';
import type { OpenPosition } from './open-position.js';
import {
	pairOpeningNotionalUsd,
	pairUnrealizedPnlPercent,
	pairUnrealizedPnlUsd
} from './positions-pnl.js';

export function buildOpenPositionFromMergedRow(
	row: MergedPairPositionRow,
	marksBySymbol: Record<string, number>
): OpenPosition {
	const markA = marksBySymbol[row.symA];
	const markB = marksBySymbol[row.symB];
	const { usd, pending } = pairUnrealizedPnlUsd(row.legA, row.legB, markA, markB);
	const denom = pairOpeningNotionalUsd(row.legA, row.legB);
	const pct = pairUnrealizedPnlPercent(usd, denom, pending);
	const netFundingPaidUsd = row.legA.fundingPaid + row.legB.fundingPaid;

	return {
		id: row.slug,
		tokenALabel: row.tokenALabel,
		tokenBLabel: row.tokenBLabel,
		allocationA: row.allocationA,
		allocationB: row.allocationB,
		generatedAt: null,
		openedAt: new Date(row.openedAt).toISOString(),
		notionalUsd: denom,
		unrealizedPnlUsd: usd,
		unrealizedPnlPercent: pct,
		netFundingPaidUsd,
		pnlPending: pending
	};
}
