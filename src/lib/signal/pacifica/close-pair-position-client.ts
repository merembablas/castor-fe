/**
 * Browser-only: fully close a long/short pair via two reduce-only market orders (API agent signing).
 */
import type { MergedPairPositionRow } from '$lib/positions/active-pairs-positions-merge.js';
import type { NormalizedLegPosition } from '$lib/positions/pacifica-position-normalize.js';
import { agentKeypairFromSecretBase58 } from './pacifica-agent-keypair.js';
import { signPacificaMessageWithSecretKey } from './pacifica-message-sign.js';
import { formatAmountString } from './trade-sizing.js';
import type { MarketSizingRow } from './trade-sizing.js';

const DEFAULT_SLIPPAGE = '3';

function decimalPlaces(s: string): number {
	const t = s.trim();
	const i = t.indexOf('.');
	return i < 0 ? 0 : t.length - i - 1;
}

function floorToStep(value: number, step: number): number {
	if (!(step > 0) || !Number.isFinite(value)) return value;
	const n = Math.floor(value / step + 1e-12);
	return n * step;
}

/** Prefer REST amount string; otherwise floor qty to lot and format. */
export function formatCloseBaseAmount(
	leg: NormalizedLegPosition,
	sizing: MarketSizingRow
): string {
	const trimmed = leg.amountRaw.trim();
	if (trimmed) return trimmed;
	const lot = Number(sizing.lotSize);
	const dec = Math.max(decimalPlaces(sizing.lotSize), decimalPlaces(sizing.minOrderSize), 8);
	if (!Number.isFinite(lot) || lot <= 0) {
		return formatAmountString(leg.qtyBase, dec);
	}
	const qty = floorToStep(leg.qtyBase, lot);
	return formatAmountString(qty, dec);
}

async function postCreateMarket(body: Record<string, unknown>): Promise<void> {
	const res = await fetch('/api/pacifica/orders/create-market', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify(body)
	});
	const j = (await res.json()) as { success?: boolean; error?: string; data?: unknown };
	if (!res.ok || !j.success) {
		throw new Error(
			typeof j.error === 'string' && j.error ? j.error : `Market order failed (HTTP ${res.status})`
		);
	}
	const inner = j.data as { success?: boolean; error?: string } | null | undefined;
	if (inner && typeof inner === 'object' && inner.success === false) {
		throw new Error(
			typeof inner.error === 'string' && inner.error
				? inner.error
				: 'Market order was rejected by exchange'
		);
	}
}

export interface ClosePairPositionClientInput {
	account: string;
	agentSecretKeyBase58: string;
	row: MergedPairPositionRow;
	rowLong: MarketSizingRow;
	rowShort: MarketSizingRow;
}

/**
 * Closes long (symA / bid) then short (symB / ask) using full leg sizes.
 * Throws Error with a user-safe message on failure (HTTP or exchange).
 */
export async function closePairPositionClient(input: ClosePairPositionClientInput): Promise<void> {
	const { row, account, agentSecretKeyBase58, rowLong, rowShort } = input;
	const { legA, legB, symA, symB } = row;

	if (legA.side !== 'bid' || legB.side !== 'ask') {
		throw new Error('This pair is not in the expected long/short layout; close it from the exchange.');
	}

	const amountLong = formatCloseBaseAmount(legA, rowLong);
	const amountShort = formatCloseBaseAmount(legB, rowShort);
	if (!amountLong || !amountShort) {
		throw new Error('Could not determine position size to close.');
	}

	const agentKp = agentKeypairFromSecretBase58(agentSecretKeyBase58);
	const agentWallet = agentKp.publicKey.toBase58();
	const secret64 = agentKp.secretKey;

	const cidLong = crypto.randomUUID();
	const marketPayloadLong: Record<string, unknown> = {
		symbol: symA,
		side: 'ask',
		amount: amountLong,
		reduce_only: true,
		slippage_percent: DEFAULT_SLIPPAGE,
		client_order_id: cidLong
	};
	const mL = signPacificaMessageWithSecretKey(secret64, 'create_market_order', marketPayloadLong);
	await postCreateMarket({
		account,
		agent_wallet: agentWallet,
		signature: mL.signature,
		timestamp: mL.timestamp,
		expiry_window: mL.expiry_window,
		...marketPayloadLong
	});

	const cidShort = crypto.randomUUID();
	const marketPayloadShort: Record<string, unknown> = {
		symbol: symB,
		side: 'bid',
		amount: amountShort,
		reduce_only: true,
		slippage_percent: DEFAULT_SLIPPAGE,
		client_order_id: cidShort
	};
	const mS = signPacificaMessageWithSecretKey(secret64, 'create_market_order', marketPayloadShort);
	await postCreateMarket({
		account,
		agent_wallet: agentWallet,
		signature: mS.signature,
		timestamp: mS.timestamp,
		expiry_window: mS.expiry_window,
		...marketPayloadShort
	});
}

export async function fetchMarketSizingRows(
	symA: string,
	symB: string
): Promise<{ rowLong: MarketSizingRow; rowShort: MarketSizingRow }> {
	const qs = `${encodeURIComponent(symA)},${encodeURIComponent(symB)}`;
	const res = await fetch(`/api/pacifica/market-info?symbols=${qs}`);
	const j = (await res.json()) as
		| {
				success: true;
				data: Record<string, { lotSize: string; minOrderSize: string }>;
				missing?: string[];
		  }
		| { success: false; error?: string };
	if (!res.ok || !j.success) {
		throw new Error(
			typeof (j as { error?: string }).error === 'string' && (j as { error: string }).error
				? (j as { error: string }).error
				: 'Could not load market info'
		);
	}
	const data = j.data ?? {};
	const ra = data[symA.trim().toUpperCase()];
	const rb = data[symB.trim().toUpperCase()];
	if (!ra || !rb || (j as { missing?: string[] }).missing?.length) {
		throw new Error('Market info is not ready for both legs.');
	}
	return {
		rowLong: { lotSize: ra.lotSize, minOrderSize: ra.minOrderSize },
		rowShort: { lotSize: rb.lotSize, minOrderSize: rb.minOrderSize }
	};
}
