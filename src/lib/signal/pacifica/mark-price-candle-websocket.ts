import { browser } from '$app/environment';

const MAX_BACKOFF_MS = 30_000;
const PING_INTERVAL_MS = 25_000;
const DEFAULT_INTERVAL = '1m';

export interface MarkPriceWsCallbacks {
	/** Latest close mark from candle payload (`c` field). */
	onMark: (symbol: string, markUsd: number) => void;
	onConnectionChange?: (connected: boolean) => void;
	onResync?: () => void;
}

export interface MarkPriceWsController {
	disconnect(): void;
}

/**
 * Subscribes to Pacifica `mark_price_candle` for many symbols on one socket; reconnects with backoff.
 * @see https://pacifica.gitbook.io/docs/api-documentation/api/websocket/subscriptions/mark-price-candle
 */
export function connectPacificaMarkPriceCandleFeed(
	wsBaseUrl: string,
	symbols: string[],
	callbacks: MarkPriceWsCallbacks,
	options?: { interval?: string }
): MarkPriceWsController {
	if (!browser) {
		return { disconnect() {} };
	}

	const uniq = [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))];
	const interval = options?.interval ?? DEFAULT_INTERVAL;

	if (uniq.length === 0) {
		return { disconnect() {} };
	}

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

	const subscribeAll = (socket: WebSocket) => {
		for (const symbol of uniq) {
			socket.send(
				JSON.stringify({
					method: 'subscribe',
					params: { source: 'mark_price_candle', symbol, interval }
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
			subscribeAll(ws!);
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
			if (o.channel === 'mark_price_candle' && o.data && typeof o.data === 'object') {
				const d = o.data as Record<string, unknown>;
				const s = typeof d.s === 'string' ? d.s.trim().toUpperCase() : '';
				const c = Number.parseFloat(String(d.c ?? '').trim());
				if (s && Number.isFinite(c) && c > 0) {
					callbacks.onMark(s, c);
				}
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
