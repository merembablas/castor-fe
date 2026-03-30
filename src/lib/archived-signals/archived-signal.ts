/** One row on /archives; same navigable shape as live signals plus archive time. */
export interface ArchivedSignal {
	slug: string;
	tokenALabel: string;
	tokenBLabel: string;
	allocationA: number;
	allocationB: number;
	/** ISO 8601 — when the signal occurred */
	generatedAt: string;
	/** ISO 8601 — when the signal was archived */
	archivedAt: string;
	description: string;
}
