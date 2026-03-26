import { browser } from '$app/environment';
import type { PacificaCandle } from './types.js';
import { PACIFICA_DEFAULT_INTERVAL, PACIFICA_INITIAL_HISTORY_MS } from './types.js';

export interface PacificaKlineLegsResyncInput {
	symbolA: string;
	symbolB: string;
}

/** Client-only REST refetch for WebSocket resync; must not run during SSR. */
export async function fetchPacificaKlineLegsForResync(
	input: PacificaKlineLegsResyncInput
): Promise<{ legA: PacificaCandle[]; legB: PacificaCandle[] } | null> {
	if (!browser) return null;

	const end = Date.now();
	const start = end - PACIFICA_INITIAL_HISTORY_MS;
	const q = new URLSearchParams({
		interval: PACIFICA_DEFAULT_INTERVAL,
		start_time: String(start),
		end_time: String(end)
	});

	const [resA, resB] = await Promise.all([
		fetch(`/api/pacifica/kline?symbol=${encodeURIComponent(input.symbolA)}&${q}`),
		fetch(`/api/pacifica/kline?symbol=${encodeURIComponent(input.symbolB)}&${q}`)
	]);

	if (!resA.ok || !resB.ok) return null;

	const bodyA = (await resA.json()) as { success: boolean; data?: PacificaCandle[] };
	const bodyB = (await resB.json()) as { success: boolean; data?: PacificaCandle[] };
	if (!bodyA.success || !bodyB.success || !bodyA.data || !bodyB.data) return null;

	return { legA: bodyA.data, legB: bodyB.data };
}
