import type { SignalCandlestickPoint } from './signal-detail.types.js';

/** Deterministic stub OHLC series for development until a real feed exists. */
export function buildStubCandlesticks(barCount = 48): SignalCandlestickPoint[] {
	const nowSec = Math.floor(Date.now() / 1000);
	let price = 2400;
	const out: SignalCandlestickPoint[] = [];

	for (let i = 0; i < barCount; i++) {
		const open = price;
		const drift = Math.sin(i / 5) * 14 + ((i * 7) % 11) - 5;
		const close = open + drift;
		const high = Math.max(open, close) + 4 + (i % 5);
		const low = Math.min(open, close) - 4 - (i % 4);
		price = close;
		out.push({
			time: nowSec - (barCount - i) * 3600,
			open,
			high,
			low,
			close
		});
	}

	return out;
}
