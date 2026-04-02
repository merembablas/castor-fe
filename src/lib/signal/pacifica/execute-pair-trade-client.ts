/**
 * Browser-only: API agent key signs Pacifica payloads; proxies submit via SvelteKit API.
 *
 * Flow:
 *  1. Validate inputs and compute notional split
 *  2. Derive base-asset quantities from mark prices + lot/min-order constraints
 *  3. Update leverage for symbol A, then symbol B (sequential, same leverage), agent-signed
 *  4. Submit long create_market_order, then short create_market_order (separate signatures)
 *  5. Caller writes active-position on full success only
 */
import { agentKeypairFromSecretBase58 } from './pacifica-agent-keypair.js';
import { signPacificaMessageWithSecretKey } from './pacifica-message-sign.js';
import type { MarketSizingRow } from './trade-sizing.js';
import { planLegSize, splitPairNotionalUsd } from './trade-sizing.js';

const DEFAULT_SLIPPAGE = '3';

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
		throw new Error(typeof j.error === 'string' && j.error ? j.error : 'Could not update leverage');
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

export interface ExecutePairTradeInput {
	/** User main wallet / Pacifica account (base58 public key). */
	account: string;
	/** Agent secret key (base58-encoded 64-byte Solana secret key). */
	agentSecretKeyBase58: string;
	symbolLong: string;
	symbolShort: string;
	leverage: number;
	/** Margin in USD: user total notional ÷ leverage (see `splitPairNotionalUsd`). */
	sizeUsd: number;
	allocationA: number;
	allocationB: number;
	markPriceLongUsd: number;
	markPriceShortUsd: number;
	rowLong: MarketSizingRow;
	rowShort: MarketSizingRow;
}

/**
 * Executes a pair trade on Pacifica using API agent signing:
 *  - Updates leverage for both symbols
 *  - Submits two create_market_order requests (long, then short)
 */
export async function executePairTradeClient(input: ExecutePairTradeInput): Promise<void> {
	const agentKp = agentKeypairFromSecretBase58(input.agentSecretKeyBase58);
	const agentWallet = agentKp.publicKey.toBase58();
	const secret64 = agentKp.secretKey;

	const split = splitPairNotionalUsd({
		sizeUsd: input.sizeUsd,
		leverage: input.leverage,
		allocationA: input.allocationA,
		allocationB: input.allocationB
	});
	if ('error' in split) {
		throw new Error(split.error);
	}

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

	const levPayloadA = { symbol: input.symbolLong, leverage: input.leverage };
	const sA = signPacificaMessageWithSecretKey(secret64, 'update_leverage', levPayloadA);
	await postLeverage({
		account: input.account,
		agent_wallet: agentWallet,
		signature: sA.signature,
		timestamp: sA.timestamp,
		expiry_window: sA.expiry_window,
		...levPayloadA
	});

	const levPayloadB = { symbol: input.symbolShort, leverage: input.leverage };
	const sB = signPacificaMessageWithSecretKey(secret64, 'update_leverage', levPayloadB);
	await postLeverage({
		account: input.account,
		agent_wallet: agentWallet,
		signature: sB.signature,
		timestamp: sB.timestamp,
		expiry_window: sB.expiry_window,
		...levPayloadB
	});

	const cidLong = crypto.randomUUID();
	const marketPayloadLong: Record<string, unknown> = {
		symbol: input.symbolLong,
		side: 'bid',
		amount: longPlan.amountStr,
		reduce_only: false,
		slippage_percent: DEFAULT_SLIPPAGE,
		client_order_id: cidLong
	};
	const mL = signPacificaMessageWithSecretKey(secret64, 'create_market_order', marketPayloadLong);
	await postCreateMarket({
		account: input.account,
		agent_wallet: agentWallet,
		signature: mL.signature,
		timestamp: mL.timestamp,
		expiry_window: mL.expiry_window,
		...marketPayloadLong
	});

	const cidShort = crypto.randomUUID();
	const marketPayloadShort: Record<string, unknown> = {
		symbol: input.symbolShort,
		side: 'ask',
		amount: shortPlan.amountStr,
		reduce_only: false,
		slippage_percent: DEFAULT_SLIPPAGE,
		client_order_id: cidShort
	};
	const mS = signPacificaMessageWithSecretKey(secret64, 'create_market_order', marketPayloadShort);
	await postCreateMarket({
		account: input.account,
		agent_wallet: agentWallet,
		signature: mS.signature,
		timestamp: mS.timestamp,
		expiry_window: mS.expiry_window,
		...marketPayloadShort
	});
}
