import type { PacificaCandle } from './pacifica/types.js';

/** One OHLC bar for the signal chart (UTC seconds on `time`). */
export interface SignalCandlestickPoint {
	time: number;
	open: number;
	high: number;
	low: number;
	close: number;
}

export interface ParsedSignalPair {
	tokenA: string;
	allocationA: number;
	tokenB: string;
	allocationB: number;
}

/** View model for the signal detail page and card. */
export interface SignalDetailViewModel extends ParsedSignalPair {
	/** Raw URL slug segment (e.g. `ETH:25-SOL:75`). */
	slug: string;
	/** When the signal was last updated per the active list API (`datetime_signal_occurred`); null if unknown. */
	updatedAt: string | null;
	/** User-facing notice when the signals API is configured but data is missing or failed (null = none). */
	signalsFeedNotice: string | null;
	description: string;
	candlesticks: SignalCandlestickPoint[];
	/** Pacifica REST failure; UI must not imply live candles. */
	chartError?: string | null;
}

/** Raw legs + WS URL for client-side merge updates (from server load). */
export interface PacificaChartFeedPayload {
	wsUrl: string;
	pacificaSymbolA: string;
	pacificaSymbolB: string;
	legA: PacificaCandle[];
	legB: PacificaCandle[];
}
