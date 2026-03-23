import { browser } from '$app/environment';
import type { PacificaCandle } from './types.js';
import { PACIFICA_DEFAULT_INTERVAL } from './types.js';

const MAX_BACKOFF_MS = 30_000;
const PING_INTERVAL_MS = 25_000;

export interface CandleWsCallbacks {
	onCandle: (candle: PacificaCandle) => void;
	onConnectionChange?: (connected: boolean) => void;
	/** Fired on open after a prior disconnect (REST overlap refetch). */
	onResync?: () => void;
}

export interface CandleWsController {
	disconnect(): void;
}

/**
 * Browser WebSocket client: subscribes to Pacifica `candle` for two symbols, reconnects with backoff.
 */
export function connectPacificaCandleFeed(
	wsBaseUrl: string,
	symbolA: string,
	symbolB: string,
	callbacks: CandleWsCallbacks,
	options?: { interval?: string }
): CandleWsController {
	if (!browser) {
		return { disconnect() {} };
	}

	const interval = options?.interval ?? PACIFICA_DEFAULT_INTERVAL;
	let ws: WebSocket | null = null;
	let reconnectAttempt = 0;
	let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	let pingTimer: ReturnType<typeof setInterval> | null = null;
	let closedByUser = false;
	let hasEverConnected = false;

	const clearPing = () => {
		if (pingTimer !== null) {
			clearInterval(pingTimer);
			pingTimer = null;
		}
	};

	const scheduleReconnect = () => {
		if (closedByUser) return;
		if (reconnectTimer !== null) clearTimeout(reconnectTimer);
		const delay = Math.min(1000 * 2 ** reconnectAttempt, MAX_BACKOFF_MS);
		reconnectAttempt += 1;
		reconnectTimer = setTimeout(() => {
			reconnectTimer = null;
			connect();
		}, delay);
	};

	const subscribeBoth = (socket: WebSocket) => {
		for (const symbol of [symbolA, symbolB]) {
			socket.send(
				JSON.stringify({
					method: 'subscribe',
					params: { source: 'candle', symbol, interval }
				})
			);
		}
	};

	const connect = () => {
		if (closedByUser) return;
		try {
			ws = new WebSocket(wsBaseUrl.replace(/\/+$/, ''));
		} catch {
			callbacks.onConnectionChange?.(false);
			scheduleReconnect();
			return;
		}

		ws.onopen = () => {
			if (hasEverConnected) {
				callbacks.onResync?.();
			}
			hasEverConnected = true;
			reconnectAttempt = 0;
			callbacks.onConnectionChange?.(true);
			subscribeBoth(ws!);
			clearPing();
			pingTimer = setInterval(() => {
				if (ws?.readyState === WebSocket.OPEN) {
					ws.send(JSON.stringify({ method: 'ping' }));
				}
			}, PING_INTERVAL_MS);
		};

		ws.onmessage = (ev) => {
			let msg: unknown;
			try {
				msg = JSON.parse(ev.data as string);
			} catch {
				return;
			}
			if (!msg || typeof msg !== 'object') return;
			const o = msg as Record<string, unknown>;
			if (o.channel === 'pong') return;
			if (o.channel === 'candle' && o.data && typeof o.data === 'object') {
				callbacks.onCandle(o.data as PacificaCandle);
			}
		};

		ws.onerror = () => {
			callbacks.onConnectionChange?.(false);
		};

		ws.onclose = () => {
			clearPing();
			callbacks.onConnectionChange?.(false);
			ws = null;
			if (!closedByUser) scheduleReconnect();
		};
	};

	connect();

	return {
		disconnect() {
			closedByUser = true;
			if (reconnectTimer !== null) {
				clearTimeout(reconnectTimer);
				reconnectTimer = null;
			}
			clearPing();
			ws?.close();
			ws = null;
		}
	};
}
