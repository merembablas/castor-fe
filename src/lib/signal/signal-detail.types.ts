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
	/** When the signal was generated (ISO 8601). */
	generatedAt: string;
	entryPrice: number;
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
