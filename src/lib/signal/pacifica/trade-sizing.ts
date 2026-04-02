import type { PacificaCandle } from './types.js';

export interface MarketSizingRow {
	lotSize: string;
	minOrderSize: string;
}

export interface LegSizePlan {
	symbol: string;
	side: 'bid' | 'ask';
	usdNotional: number;
	price: number;
	amountStr: string;
}

function parsePacificaPriceField(raw: unknown): number | null {
	if (raw == null) return null;
	if (typeof raw === 'number') {
		return Number.isFinite(raw) && raw > 0 ? raw : null;
	}
	const n = Number.parseFloat(String(raw).trim());
	return Number.isFinite(n) && n > 0 ? n : null;
}

/** Latest candle close by Pacifica field `t` (API may use seconds or ms; strings or numbers for OHLC). */
export function lastCandleCloseUsd(leg: PacificaCandle[]): number | null {
	if (leg.length === 0) return null;
	let best = leg[0]!;
	for (const c of leg) {
		const tb = best.t ?? 0;
		const tc = c.t ?? 0;
		if (tc > tb) best = c;
	}
	return parsePacificaPriceField(best.c);
}

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

/**
 * Smallest base quantity that satisfies Pacifica min order and lot grid (for sizing lower bounds).
 */
export function minExecutableBaseQty(row: MarketSizingRow): number | null {
	const lot = Number(row.lotSize);
	const minQ = Number(row.minOrderSize);
	if (!Number.isFinite(lot) || lot <= 0) return null;
	if (!Number.isFinite(minQ) || minQ <= 0) return null;
	const steps = Math.ceil(minQ / lot - 1e-12);
	return steps * lot;
}

/**
 * Minimum **margin USD** (capital at the given leverage) so both legs meet min base + lot after split.
 * Signal detail treats user **total notional** as margin × leverage; minimum total = this value × leverage.
 * Uses mark prices × min executable base per leg.
 */
export function minCollateralUsdForPair(input: {
	allocationA: number;
	allocationB: number;
	leverage: number;
	priceLongUsd: number;
	priceShortUsd: number;
	rowLong: MarketSizingRow;
	rowShort: MarketSizingRow;
}): number | null {
	const {
		allocationA,
		allocationB,
		leverage,
		priceLongUsd,
		priceShortUsd,
		rowLong,
		rowShort
	} = input;
	if (!(leverage >= 1) || !Number.isFinite(leverage)) return null;
	if (!(priceLongUsd > 0) || !(priceShortUsd > 0)) return null;

	const minBaseLong = minExecutableBaseQty(rowLong);
	const minBaseShort = minExecutableBaseQty(rowShort);
	if (minBaseLong == null || minBaseShort == null) return null;

	let maxCollateral = 0;

	if (allocationA > 0) {
		const minLegUsd = minBaseLong * priceLongUsd;
		const minTotalNotional = (minLegUsd * 100) / allocationA;
		const coll = minTotalNotional / leverage;
		if (Number.isFinite(coll) && coll > maxCollateral) maxCollateral = coll;
	}
	if (allocationB > 0) {
		const minLegUsd = minBaseShort * priceShortUsd;
		const minTotalNotional = (minLegUsd * 100) / allocationB;
		const coll = minTotalNotional / leverage;
		if (Number.isFinite(coll) && coll > maxCollateral) maxCollateral = coll;
	}

	return maxCollateral > 0 ? maxCollateral : null;
}

/** Minimum total notional (USD) implied by {@link minCollateralUsdForPair} at integer leverage ≥ 1. */
export function minTotalNotionalUsdFromMinMargin(minMarginUsd: number, leverage: number): number {
	return minMarginUsd * leverage;
}

/** Format positive amount for Pacifica `amount` string (no scientific notation). */
export function formatAmountString(value: number, maxDecimals: number): string {
	if (!(value > 0) || !Number.isFinite(value)) return '';
	const s = value.toFixed(Math.min(16, Math.max(0, maxDecimals)));
	return s.replace(/\.?0+$/, '');
}

/**
 * USD notional → base size, floored to lot, must be ≥ min order size (base units).
 */
export function planLegSize(input: {
	symbol: string;
	side: 'bid' | 'ask';
	usdNotional: number;
	priceUsd: number;
	row: MarketSizingRow;
}): { amountStr: string } | { error: string } {
	const { usdNotional, priceUsd, row } = input;
	if (!(usdNotional > 0) || !(priceUsd > 0)) {
		return { error: 'Missing price or notional for sizing.' };
	}
	const rawQty = usdNotional / priceUsd;
	const lot = Number(row.lotSize);
	const minQ = Number(row.minOrderSize);
	if (!Number.isFinite(lot) || lot <= 0) {
		return { error: `Invalid lot size for ${input.symbol}.` };
	}
	if (!Number.isFinite(minQ) || minQ <= 0) {
		return { error: `Invalid min order size for ${input.symbol}.` };
	}
	const qty = floorToStep(rawQty, lot);
	if (!(qty >= minQ - 1e-15)) {
		const minBase = minExecutableBaseQty(row);
		const minLegUsd = minBase != null && priceUsd > 0 ? minBase * priceUsd : null;
		const legHint =
			minLegUsd != null
				? ` This leg needs about ${minLegUsd.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} notional at current price (min ${minQ} base units).`
				: '';
		return {
			error: `Order size too small for ${input.symbol} after lot rounding (minimum ${minQ} base units on the exchange).${legHint} Increase margin, total amount, or leverage.`
		};
	}
	const dec = Math.max(decimalPlaces(row.lotSize), decimalPlaces(row.minOrderSize), 8);
	const amountStr = formatAmountString(qty, dec);
	if (!amountStr) {
		return { error: `Could not format size for ${input.symbol}.` };
	}
	return { amountStr };
}

/**
 * @param sizeUsd Margin in USD (total notional ÷ leverage). Total notional = sizeUsd × leverage.
 */
export function splitPairNotionalUsd(input: {
	sizeUsd: number;
	leverage: number;
	allocationA: number;
	allocationB: number;
}): { total: number; longUsd: number; shortUsd: number } | { error: string } {
	const { sizeUsd, leverage, allocationA, allocationB } = input;
	if (!(sizeUsd > 0) || !Number.isFinite(sizeUsd)) {
		return { error: 'Enter a valid position size.' };
	}
	if (!(leverage >= 1) || !Number.isFinite(leverage)) {
		return { error: 'Invalid leverage.' };
	}
	const sum = allocationA + allocationB;
	if (sum !== 100) {
		return { error: 'Signal allocations must sum to 100%.' };
	}
	const total = sizeUsd * leverage;
	return {
		total,
		longUsd: total * (allocationA / 100),
		shortUsd: total * (allocationB / 100)
	};
}
