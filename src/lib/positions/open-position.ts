/** Row model for `/positions` list items (live Pacifica-backed data). */
export interface OpenPosition {
	id: string;
	tokenALabel: string;
	tokenBLabel: string;
	allocationA: number;
	allocationB: number;
	/** Signal “generated” time when available (ISO 8601); omit UI when null. */
	generatedAt: string | null;
	/** ISO 8601 from `openedAt` ms in storage. */
	openedAt: string;
	/** Approximate opening notional (USD) from leg qty × entry. */
	notionalUsd: number;
	unrealizedPnlUsd: number;
	unrealizedPnlPercent: number;
	/** True until first mark price candle received for both legs. */
	pnlPending?: boolean;
}
