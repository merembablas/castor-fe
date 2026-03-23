/** Single candle from Pacifica REST / WS (`/api/v1/kline` and candle channel). */
export interface PacificaCandle {
	t: number;
	T?: number;
	s?: string;
	i?: string;
	o: string;
	c: string;
	h: string;
	l: string;
	v?: string;
	n?: number;
}

export interface PacificaKlineResponse {
	success: boolean;
	data: PacificaCandle[] | null;
	error?: string | null;
	code?: string | null;
}

export const PACIFICA_DEFAULT_INTERVAL = '1h' as const;

/** History window for initial REST load (ms). */
export const PACIFICA_INITIAL_HISTORY_MS = 14 * 24 * 60 * 60 * 1000;
