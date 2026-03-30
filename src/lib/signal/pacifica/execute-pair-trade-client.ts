/**
 * Browser-only: wallet signs Pacifica payloads; proxies submit via SvelteKit API.
 *
 * Flow:
 *  1. Validate inputs and compute notional split
 *  2. Derive base-asset quantities from mark prices + lot/min-order constraints
 *  3. Update leverage for symbol A, then symbol B (sequential, same leverage)
 *  4. Sign both market orders with a single shared timestamp (required for batch)
 *  5. Submit one batch containing the long (bid) and short (ask) market orders
 *  6. Caller writes active-position on full success only
 */
import { base58Encode } from './base58-encode.js';
import {
	buildPacificaSignableMessage,
	type PacificaOperationType
} from './pacifica-message-sign.js';
import type { MarketSizingRow } from './trade-sizing.js';
import { planLegSize, splitPairNotionalUsd } from './trade-sizing.js';

// 3 % gives enough room for the fill to clear the mark-price check on thin test-env orderbooks
// while still protecting against runaway fills on normal markets.
const DEFAULT_SLIPPAGE = '3';

export interface PacificaSignMessageAdapter {
	signMessage(message: Uint8Array): Promise<Uint8Array>;
}

async function signPacificaPayload(
	adapter: PacificaSignMessageAdapter,
	type: PacificaOperationType,
	payload: Record<string, unknown>,
	/** Pass a pre-generated timestamp so multiple payloads in one batch share it. */
	timestamp: number = Date.now()
): Promise<{ timestamp: number; expiry_window: number; signature: string }> {
	const expiry_window = 30_000;
	const header = { timestamp, expiry_window, type };
	const message = buildPacificaSignableMessage(header, payload);
	const messageBytes = new TextEncoder().encode(message);
	const sigBytes = await adapter.signMessage(messageBytes);
	return { timestamp, expiry_window, signature: base58Encode(sigBytes) };
}

async function postLeverage(body: Record<string, unknown>): Promise<void> {
	const res = await fetch('/api/pacifica/account/leverage', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify(body)
	});
	const j = (await res.json()) as {
		success?: boolean;
		error?: string;
		data?: unknown;
	};
	if (!res.ok || !j.success) {
		throw new Error(
			typeof j.error === 'string' && j.error ? j.error : 'Could not update leverage'
		);
	}
	const inner = j.data as { success?: boolean; error?: string } | null | undefined;
	if (inner && typeof inner === 'object' && inner.success === false) {
		throw new Error(
			typeof inner.error === 'string' && inner.error
				? inner.error
				: 'Leverage update was rejected by exchange'
		);
	}
}

async function postBatch(actions: unknown[]): Promise<void> {
	const res = await fetch('/api/pacifica/orders/batch', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify({ actions })
	});
	const j = (await res.json()) as { success?: boolean; error?: string; data?: unknown };
	if (!res.ok || !j.success) {
		const msg =
			typeof j.error === 'string' && j.error
				? j.error
				: `Batch order failed (HTTP ${res.status})`;
		throw new Error(msg);
	}

	const pacifica = j.data as {
		success?: boolean;
		data?: { results?: Array<{ success?: boolean; error?: string | null }> };
		error?: string | null;
	} | null;

	if (!pacifica || pacifica.success !== true) {
		throw new Error(
			typeof pacifica?.error === 'string' && pacifica.error
				? pacifica.error
				: 'Batch was not accepted by exchange'
		);
	}

	const results = pacifica.data?.results;
	if (!Array.isArray(results)) {
		throw new Error('Unexpected batch response: missing results array');
	}
	for (const r of results) {
		if (r && r.success === false) {
			throw new Error(
				typeof r.error === 'string' && r.error ? r.error : 'One leg of the pair order failed'
			);
		}
	}
}

export interface ExecutePairTradeInput {
	adapter: PacificaSignMessageAdapter;
	/** Pacifica wallet address (base58 public key). */
	account: string;
	/** Pacifica symbol for the long leg (token A). */
	symbolLong: string;
	/** Pacifica symbol for the short leg (token B). */
	symbolShort: string;
	/** Leverage integer to apply to both symbols. */
	leverage: number;
	/** User collateral amount in USD; notional = sizeUsd × leverage. */
	sizeUsd: number;
	/** Allocation percentage for the long leg (token A), 0-100 integer. */
	allocationA: number;
	/** Allocation percentage for the short leg (token B), 0-100 integer. */
	allocationB: number;
	/** Current mark/mid price for the long symbol in USD. */
	markPriceLongUsd: number;
	/** Current mark/mid price for the short symbol in USD. */
	markPriceShortUsd: number;
	/** Cached market sizing row for the long symbol. */
	rowLong: MarketSizingRow;
	/** Cached market sizing row for the short symbol. */
	rowShort: MarketSizingRow;
}

/**
 * Executes a pair trade on Pacifica:
 *  - Updates leverage for both symbols
 *  - Submits a batch with one long market order and one short market order
 *
 * Throws on any step failure; does NOT write active-position state (caller's responsibility).
 */
export async function executePairTradeClient(input: ExecutePairTradeInput): Promise<void> {
	// 1. Compute USD notional split
	const split = splitPairNotionalUsd({
		sizeUsd: input.sizeUsd,
		leverage: input.leverage,
		allocationA: input.allocationA,
		allocationB: input.allocationB
	});
	if ('error' in split) {
		throw new Error(split.error);
	}

	// 2. Convert USD notional → base-asset quantities, respecting lot/min constraints
	const longPlan = planLegSize({
		symbol: input.symbolLong,
		side: 'bid',
		usdNotional: split.longUsd,
		priceUsd: input.markPriceLongUsd,
		row: input.rowLong
	});
	if ('error' in longPlan) {
		throw new Error(longPlan.error);
	}

	const shortPlan = planLegSize({
		symbol: input.symbolShort,
		side: 'ask',
		usdNotional: split.shortUsd,
		priceUsd: input.markPriceShortUsd,
		row: input.rowShort
	});
	if ('error' in shortPlan) {
		throw new Error(shortPlan.error);
	}

	// 3. Update leverage: symbol A then symbol B (must complete before orders)
	const levPayloadA = { symbol: input.symbolLong, leverage: input.leverage };
	const sA = await signPacificaPayload(input.adapter, 'update_leverage', levPayloadA);
	await postLeverage({
		account: input.account,
		signature: sA.signature,
		timestamp: sA.timestamp,
		expiry_window: sA.expiry_window,
		...levPayloadA
	});

	const levPayloadB = { symbol: input.symbolShort, leverage: input.leverage };
	const sB = await signPacificaPayload(input.adapter, 'update_leverage', levPayloadB);
	await postLeverage({
		account: input.account,
		signature: sB.signature,
		timestamp: sB.timestamp,
		expiry_window: sB.expiry_window,
		...levPayloadB
	});

	// 4. Sign both market orders with a SINGLE shared timestamp (Pacifica batch requirement)
	const batchTimestamp = Date.now();
	const cidLong = crypto.randomUUID();
	const cidShort = crypto.randomUUID();

	const marketPayloadLong: Record<string, unknown> = {
		symbol: input.symbolLong,
		side: 'bid',
		amount: longPlan.amountStr,
		reduce_only: false,
		slippage_percent: DEFAULT_SLIPPAGE,
		client_order_id: cidLong
	};
	const mL = await signPacificaPayload(
		input.adapter,
		'create_market_order',
		marketPayloadLong,
		batchTimestamp
	);
	const orderLong = {
		account: input.account,
		signature: mL.signature,
		timestamp: mL.timestamp,
		expiry_window: mL.expiry_window,
		...marketPayloadLong
	};

	const marketPayloadShort: Record<string, unknown> = {
		symbol: input.symbolShort,
		side: 'ask',
		amount: shortPlan.amountStr,
		reduce_only: false,
		slippage_percent: DEFAULT_SLIPPAGE,
		client_order_id: cidShort
	};
	const mS = await signPacificaPayload(
		input.adapter,
		'create_market_order',
		marketPayloadShort,
		batchTimestamp
	);
	const orderShort = {
		account: input.account,
		signature: mS.signature,
		timestamp: mS.timestamp,
		expiry_window: mS.expiry_window,
		...marketPayloadShort
	};

	// 5. Submit batch: long (bid) + short (ask) as "CreateMarket" actions.
	//    The Pacifica batch docs list "Create" for limit orders and "CreateMarket" for market orders
	//    (see speed-bump section: "Market orders (CreateMarket)"). Using "Create" here would fail
	//    with 400 because the limit-order schema expects a price + tif which market orders omit.
	await postBatch([
		{ type: 'CreateMarket', data: orderLong },
		{ type: 'CreateMarket', data: orderShort }
	]);
}
