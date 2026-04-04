<script lang="ts">
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import SignalWeightedChartSection from '$lib/components/signal-weighted-chart-section.svelte';
	import { effectiveMaxLeverage } from '$lib/signal/pacifica/leverage-options.js';
	import { toPacificaSymbol } from '$lib/signal/pacifica/symbol.js';
	import { loadPacificaAgent } from '$lib/signal/pacifica/pacifica-agent-storage.js';
	import {
		executePairTradeClient,
		type PacificaOpenPositionDryRunCall
	} from '$lib/signal/pacifica/execute-pair-trade-client.js';
	import {
		lastCandleCloseUsd,
		MIN_POSITION_ENTRY_TOTAL_USD,
		MIN_POSITION_LEG_NOTIONAL_USD,
		minTotalNotionalForLegFloors
	} from '$lib/signal/pacifica/trade-sizing.js';
	import { appendActivePairPosition, isSlugActive } from '$lib/signal/active-pair-positions.js';
	import { solanaWallet } from '$lib/solana/wallet.svelte.js';
	import type { PacificaCandle } from '$lib/signal/pacifica/types.js';
	import type {
		PacificaChartFeedPayload,
		SignalDetailViewModel
	} from '$lib/signal/signal-detail.types.js';
	import { cn } from '$lib/utils.js';

	interface Props {
		signal: SignalDetailViewModel;
		pacificaFeed: PacificaChartFeedPayload | null;
	}

	let { signal, pacificaFeed }: Props = $props();

	interface MarketRowPublic {
		symbol: string;
		maxLeverage: number;
		lotSize: string;
		minOrderSize: string;
		tickSize: string;
		minTick: string;
		maxTick: string;
	}

	type MarketLoadState = 'idle' | 'loading' | 'ok' | 'error';

	type AccountLoadState = 'idle' | 'loading' | 'ok' | 'error';

	interface AccountPayload {
		accountEquity: string;
		totalMarginUsed: string;
		availableToSpend: string;
		availableToWithdraw: string;
		balance: string;
		updatedAt: number;
	}

	let totalAmountInputStr = $state('');
	/** When false, total amount syncs to computed minimum total when leverage/prices change. */
	let totalAmountUserEdited = $state(false);

	let marketState = $state<MarketLoadState>('idle');
	let marketError = $state<string | null>(null);
	let rowsBySymbol = $state<Record<string, MarketRowPublic>>({});

	let leverageInt = $state<number | null>(null);

	let accountState = $state<AccountLoadState>('idle');
	let accountError = $state<string | null>(null);
	let accountData = $state<AccountPayload | null>(null);

	let slugActive = $state(false);
	let tradeBusy = $state(false);
	let tradeError = $state<string | null>(null);
	/** When true, Open position builds signed proxy payloads only (no order/leverage POSTs) and skips exchange-min size for the CTA. */
	let debugDryRunOpenPosition = $state(false);
	let dryRunPreviewCalls = $state<PacificaOpenPositionDryRunCall[] | null>(null);

	/** Mark prices when SSR feed legs lack usable closes (info/prices, then kline). */
	let supplementalCloseA = $state<number | null>(null);
	let supplementalCloseB = $state<number | null>(null);
	let priceLoadError = $state<string | null>(null);

	const priceFormatter = new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 2
	});

	const pctFormatter = new Intl.NumberFormat(undefined, {
		style: 'percent',
		maximumFractionDigits: 1
	});

	const symA = $derived(toPacificaSymbol(signal.tokenA));
	const symB = $derived(toPacificaSymbol(signal.tokenB));

	const updatedLabel = $derived.by(() => {
		if (!signal.updatedAt) return '';
		const d = new Date(signal.updatedAt);
		if (Number.isNaN(d.getTime())) return signal.updatedAt;
		return new Intl.DateTimeFormat(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(d);
	});

	/** User-entered total notional (USD) for the pair open. */
	const totalAmountUsd = $derived.by(() => {
		const n = Number.parseFloat(totalAmountInputStr.replace(',', '.'));
		if (!Number.isFinite(n) || n <= 0) return null;
		return n;
	});

	const canOpenPosition = $derived(totalAmountUsd !== null);

	const estimateLongLegUsd = $derived(
		totalAmountUsd != null ? totalAmountUsd * (signal.allocationA / 100) : null
	);

	const estimateShortLegUsd = $derived(
		totalAmountUsd != null ? totalAmountUsd * (signal.allocationB / 100) : null
	);

	const pairSummary = $derived(
		`${signal.tokenA} ${signal.allocationA}% / ${signal.tokenB} ${signal.allocationB}%`
	);

	const effectiveMax = $derived.by(() => {
		const ra = rowsBySymbol[symA];
		const rb = rowsBySymbol[symB];
		if (!ra || !rb) return null;
		return effectiveMaxLeverage(ra.maxLeverage, rb.maxLeverage);
	});

	const selectedLeverage = $derived(
		leverageInt != null && Number.isFinite(leverageInt) && leverageInt >= 1 ? leverageInt : null
	);

	const marginForOrderUsd = $derived(
		totalAmountUsd != null && selectedLeverage != null && selectedLeverage > 0
			? totalAmountUsd / selectedLeverage
			: null
	);

	const legCloseA = $derived(pacificaFeed != null ? lastCandleCloseUsd(pacificaFeed.legA) : null);
	const legCloseB = $derived(pacificaFeed != null ? lastCandleCloseUsd(pacificaFeed.legB) : null);

	const markPriceLongUsd = $derived(legCloseA ?? supplementalCloseA);
	const markPriceShortUsd = $derived(legCloseB ?? supplementalCloseB);

	const pricesReady = $derived(markPriceLongUsd != null && markPriceShortUsd != null);

	const walletReadyForTrade = $derived(
		solanaWallet.initialized &&
			solanaWallet.connected &&
			solanaWallet.publicKey != null &&
			solanaWallet.adapter != null &&
			typeof solanaWallet.adapter.signMessage === 'function' &&
			solanaWallet.pacificaAgentReady
	);

	const effectiveMinTotalUsd = $derived(
		minTotalNotionalForLegFloors(signal.allocationA, signal.allocationB)
	);

	const totalBelowEffectiveMinimum = $derived(
		totalAmountUsd != null && totalAmountUsd + 1e-9 < effectiveMinTotalUsd
	);

	const openPositionDisabled = $derived.by(() => {
		if (!canOpenPosition) return true;
		if (!walletReadyForTrade) return true;
		if (marketState !== 'ok') return true;
		if (selectedLeverage == null) return true;
		if (tradeBusy) return true;
		if (slugActive) return true;
		if (!pricesReady) return true;
		const ra = rowsBySymbol[symA];
		const rb = rowsBySymbol[symB];
		if (!ra || !rb) return true;
		if (totalAmountUsd != null && totalAmountUsd + 1e-9 < effectiveMinTotalUsd) return true;
		return false;
	});

	const marginUsedRatio = $derived.by(() => {
		if (!accountData) return null;
		const eq = Number(accountData.accountEquity);
		const used = Number(accountData.totalMarginUsed);
		if (!Number.isFinite(eq) || eq <= 0 || !Number.isFinite(used) || used < 0) return null;
		return Math.min(1, used / eq);
	});

	onMount(() => {
		solanaWallet.ensureInit();
		slugActive = isSlugActive(signal.slug);
	});

	$effect(() => {
		const s = signal.slug;
		if (typeof window !== 'undefined') {
			slugActive = isSlugActive(s);
		}
	});

	$effect(() => {
		if (!debugDryRunOpenPosition) {
			dryRunPreviewCalls = null;
		}
	});

	$effect(() => {
		if (!browser) return;

		const fromA = legCloseA;
		const fromB = legCloseB;
		const a = symA;
		const b = symB;

		if (fromA != null && fromB != null) {
			supplementalCloseA = null;
			supplementalCloseB = null;
			priceLoadError = null;
			return;
		}

		supplementalCloseA = null;
		supplementalCloseB = null;
		priceLoadError = null;

		let cancelled = false;

		function parseMark(raw: string | undefined): number | null {
			if (!raw) return null;
			const n = Number.parseFloat(raw.trim());
			return Number.isFinite(n) && n > 0 ? n : null;
		}

		async function fetchMarksFromInfoPrices(): Promise<{ pa: number | null; pb: number | null }> {
			const q = new URLSearchParams({ symbols: `${a},${b}` });
			try {
				const r = await fetch(`/api/pacifica/prices?${q}`);
				if (!r.ok) return { pa: null, pb: null };
				const j = (await r.json()) as {
					success?: boolean;
					bySymbol?: Record<string, string>;
				};
				if (!j.success || !j.bySymbol) return { pa: null, pb: null };
				return {
					pa: parseMark(j.bySymbol[a]),
					pb: parseMark(j.bySymbol[b])
				};
			} catch {
				return { pa: null, pb: null };
			}
		}

		async function fetchLastCloseKline(sym: string): Promise<number | null> {
			const end = Date.now();
			const start = end - 14 * 24 * 60 * 60 * 1000;
			const q = new URLSearchParams({
				symbol: sym,
				interval: '1h',
				start_time: String(start),
				end_time: String(end)
			});
			try {
				const r = await fetch(`/api/pacifica/kline?${q}`);
				if (!r.ok) return null;
				const j = (await r.json()) as {
					success?: boolean;
					data?: PacificaCandle[];
				};
				if (!j.success || !Array.isArray(j.data) || j.data.length === 0) return null;
				return lastCandleCloseUsd(j.data);
			} catch {
				return null;
			}
		}

		void (async () => {
			let sa: number | null = fromA;
			let sb: number | null = fromB;

			if (sa == null || sb == null) {
				const { pa, pb } = await fetchMarksFromInfoPrices();
				if (cancelled) return;
				if (sa == null) sa = pa;
				if (sb == null) sb = pb;
			}

			if (!cancelled && sa == null) sa = await fetchLastCloseKline(a);
			if (!cancelled && sb == null) sb = await fetchLastCloseKline(b);

			if (cancelled) return;

			if (fromA == null) supplementalCloseA = sa;
			else supplementalCloseA = null;

			if (fromB == null) supplementalCloseB = sb;
			else supplementalCloseB = null;

			const miss: string[] = [];
			if (fromA == null && sa == null) miss.push(a);
			if (fromB == null && sb == null) miss.push(b);
			if (miss.length > 0) {
				priceLoadError = `Could not load mark prices for ${miss.join(' and ')}. Check symbols and Pacifica connectivity.`;
			}
		})();

		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		const a = symA;
		const b = symB;
		let cancelled = false;
		marketState = 'loading';
		marketError = null;

		const qs = `${encodeURIComponent(a)},${encodeURIComponent(b)}`;
		fetch(`/api/pacifica/market-info?symbols=${qs}`)
			.then(async (r) => {
				const j = (await r.json()) as
					| { success: true; data: Record<string, MarketRowPublic>; missing?: string[] }
					| { success: false; error?: string };
				if (cancelled) return;
				if (!j.success) {
					marketState = 'error';
					marketError = 'error' in j && j.error ? j.error : 'Could not load market info';
					rowsBySymbol = {};
					return;
				}
				if (j.missing?.length) {
					marketState = 'error';
					marketError = `Unknown market(s): ${j.missing.join(', ')}`;
					rowsBySymbol = {};
					return;
				}
				marketState = 'ok';
				rowsBySymbol = j.data ?? {};
			})
			.catch((e) => {
				if (cancelled) return;
				marketState = 'error';
				marketError = e instanceof Error ? e.message : 'Market info request failed';
				rowsBySymbol = {};
			});

		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		const em = effectiveMax;
		if (em == null || em < 1) {
			leverageInt = null;
			return;
		}
		const cur = leverageInt;
		if (cur == null) {
			leverageInt = em;
			return;
		}
		if (cur < 1) leverageInt = 1;
		else if (cur > em) leverageInt = em;
	});

	$effect(() => {
		if (totalAmountUserEdited) return;
		if (marketState !== 'ok') return;
		const ra = rowsBySymbol[symA];
		const rb = rowsBySymbol[symB];
		if (!ra || !rb) return;
		totalAmountInputStr = String(
			minTotalNotionalForLegFloors(signal.allocationA, signal.allocationB)
		);
	});

	$effect(() => {
		solanaWallet.ensureInit();
		const connected = solanaWallet.connected;
		const pk = solanaWallet.publicKey;

		if (!connected || !pk) {
			accountState = 'idle';
			accountData = null;
			accountError = null;
			return;
		}

		const addr = pk.toBase58();
		let cancelled = false;
		accountState = 'loading';
		accountError = null;

		const q = new URLSearchParams({ account: addr });
		fetch(`/api/pacifica/account?${q}`)
			.then(async (r) => {
				const j = (await r.json()) as
					| { success: true; data: AccountPayload }
					| { success: false; error?: string };
				if (cancelled) return;
				if (!j.success) {
					accountState = 'error';
					accountError = j.error ?? 'Could not load account';
					accountData = null;
					return;
				}
				accountState = 'ok';
				accountData = j.data;
			})
			.catch((e) => {
				if (cancelled) return;
				accountState = 'error';
				accountError = e instanceof Error ? e.message : 'Account request failed';
				accountData = null;
			});

		return () => {
			cancelled = true;
		};
	});

	function onTotalAmountFieldInput() {
		totalAmountUserEdited = true;
	}

	function applyMinTotalAmount() {
		totalAmountUserEdited = true;
		totalAmountInputStr = String(
			minTotalNotionalForLegFloors(signal.allocationA, signal.allocationB)
		);
	}

	/** Fetch the latest mark prices from Pacifica for both symbols immediately before sizing. */
	async function fetchFreshMarkPrices(): Promise<{ pa: number | null; pb: number | null }> {
		try {
			const q = new URLSearchParams({ symbols: `${symA},${symB}` });
			const r = await fetch(`/api/pacifica/prices?${q}`);
			if (!r.ok) return { pa: null, pb: null };
			const j = (await r.json()) as { success?: boolean; bySymbol?: Record<string, string> };
			if (!j.success || !j.bySymbol) return { pa: null, pb: null };
			const parse = (v: string | undefined) => {
				if (!v) return null;
				const n = Number.parseFloat(v.trim());
				return Number.isFinite(n) && n > 0 ? n : null;
			};
			return { pa: parse(j.bySymbol[symA]), pb: parse(j.bySymbol[symB]) };
		} catch {
			return { pa: null, pb: null };
		}
	}

	async function handleOpenPosition() {
		if (totalAmountUsd === null || selectedLeverage == null || openPositionDisabled) return;
		tradeError = null;
		const pk = solanaWallet.publicKey;
		if (!pk) {
			tradeError = 'Connect your wallet first.';
			return;
		}
		const agent = loadPacificaAgent(pk.toBase58());
		if (!agent?.bound) {
			tradeError =
				'Pacifica trading keys are not ready. Approve the bind signature when connecting, or reconnect your wallet.';
			return;
		}
		const ra = rowsBySymbol[symA];
		const rb = rowsBySymbol[symB];
		if (!ra || !rb) {
			tradeError = 'Market info is not ready.';
			return;
		}

		tradeBusy = true;
		try {
			// Always refresh mark prices from Pacifica immediately before sizing so amounts
			// reflect the current mark and avoid "Price too far from mark" rejections.
			const { pa, pb } = await fetchFreshMarkPrices();
			const freshLong = pa ?? markPriceLongUsd;
			const freshShort = pb ?? markPriceShortUsd;

			if (freshLong == null || freshShort == null) {
				tradeError = 'Could not load current prices. Try again in a moment.';
				return;
			}

			if (debugDryRunOpenPosition) {
				const calls = await executePairTradeClient(
					{
						account: pk.toBase58(),
						agentSecretKeyBase58: agent.secretKeyBase58,
						symbolLong: symA,
						symbolShort: symB,
						leverage: selectedLeverage,
						sizeUsd: totalAmountUsd / selectedLeverage,
						allocationA: signal.allocationA,
						allocationB: signal.allocationB,
						markPriceLongUsd: freshLong,
						markPriceShortUsd: freshShort,
						rowLong: { lotSize: ra.lotSize, minOrderSize: ra.minOrderSize },
						rowShort: { lotSize: rb.lotSize, minOrderSize: rb.minOrderSize }
					},
					{ dryRun: true }
				);
				dryRunPreviewCalls = Array.isArray(calls) ? calls : null;
			} else {
				await executePairTradeClient({
					account: pk.toBase58(),
					agentSecretKeyBase58: agent.secretKeyBase58,
					symbolLong: symA,
					symbolShort: symB,
					leverage: selectedLeverage,
					sizeUsd: totalAmountUsd / selectedLeverage,
					allocationA: signal.allocationA,
					allocationB: signal.allocationB,
					markPriceLongUsd: freshLong,
					markPriceShortUsd: freshShort,
					rowLong: { lotSize: ra.lotSize, minOrderSize: ra.minOrderSize },
					rowShort: { lotSize: rb.lotSize, minOrderSize: rb.minOrderSize }
				});
				appendActivePairPosition(signal.slug);
				slugActive = true;
				dryRunPreviewCalls = null;
			}
		} catch (e) {
			tradeError =
				e instanceof Error ? e.message : 'Something went wrong while opening the position.';
		} finally {
			tradeBusy = false;
		}
	}

	const rangeTrackClass = cn(
		'h-2 w-full max-w-[220px] cursor-pointer appearance-none rounded-full bg-[#527E88]/20',
		'accent-[#22C1EE] disabled:cursor-not-allowed disabled:opacity-50',
		'[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#22C1EE] [&::-webkit-slider-thumb]:shadow-md',
		'[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#22C1EE]'
	);
</script>

<article
	class={cn(
		'mx-auto w-full max-w-3xl overflow-x-hidden',
		'rounded-[24px] border border-white/60 bg-white/40 p-6 shadow-[0_10px_30px_-10px_rgba(34,193,238,0.2)] backdrop-blur-md md:p-8'
	)}
	aria-labelledby="signal-heading"
>
	<header class="mb-6 space-y-3">
		<div
			class="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-4"
		>
			<p class="text-sm font-medium tracking-wide text-[#527E88]">Trading signal</p>
			{#if signal.updatedAt}
				<p class="text-sm text-[#527E88]/90 tabular-nums">
					Updated
					<time datetime={signal.updatedAt} class="font-medium text-[#144955]">{updatedLabel}</time>
				</p>
			{/if}
		</div>
		{#if signal.signalsFeedNotice}
			<p class="text-xs text-[#527E88]" role="status">{signal.signalsFeedNotice}</p>
		{/if}
		<div
			class="flex flex-wrap items-center gap-2 gap-y-2"
			role="group"
			aria-label="Token allocations: long {signal.tokenA} {signal.allocationA} percent, short {signal.tokenB} {signal.allocationB} percent"
		>
			<span
				class="inline-flex items-center gap-1.5 rounded-full bg-[#22C1EE]/15 px-2.5 py-1 text-sm font-semibold text-[#144955] ring-1 ring-[#22C1EE]/35"
				title="Long leg"
			>
				<svg
					class="h-3.5 w-3.5 shrink-0 text-[#22C1EE]"
					viewBox="0 0 16 16"
					fill="none"
					aria-hidden="true"
				>
					<path
						d="M8 3v10M8 3l3 3M8 3L5 6"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<span class="text-[#22C1EE]">{signal.tokenA}</span>
				<span class="text-[#527E88]">·</span>
				<span>{signal.allocationA}%</span>
				<span class="text-[10px] font-medium tracking-wide text-[#527E88] uppercase">Long</span>
			</span>
			<span class="text-[#527E88]">/</span>
			<span
				class="inline-flex items-center gap-1.5 rounded-full bg-[#144955]/10 px-2.5 py-1 text-sm font-semibold text-[#144955] ring-1 ring-[#144955]/25"
				title="Short leg"
			>
				<svg
					class="h-3.5 w-3.5 shrink-0 text-[#144955]"
					viewBox="0 0 16 16"
					fill="none"
					aria-hidden="true"
				>
					<path
						d="M8 13V3M8 13l3-3M8 13l-3-3"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<span class="text-[#144955]">{signal.tokenB}</span>
				<span class="text-[#527E88]">·</span>
				<span>{signal.allocationB}%</span>
				<span class="text-[10px] font-medium tracking-wide text-[#527E88] uppercase">Short</span>
			</span>
		</div>
	</header>

	{#key signal.slug}
		<SignalWeightedChartSection
			initialCandlesticks={signal.candlesticks}
			chartError={signal.chartError}
			feed={pacificaFeed}
			allocationA={signal.allocationA}
			allocationB={signal.allocationB}
		/>
	{/key}

	<section class="mb-8 space-y-2" aria-labelledby="desc-heading">
		<h2 id="desc-heading" class="text-sm font-semibold text-[#144955]">Description</h2>
		<p class="leading-relaxed text-pretty text-[#527E88]">{signal.description}</p>
	</section>

	{#if solanaWallet.connected && solanaWallet.publicKey}
		<section
			class="mb-6 rounded-2xl border border-[#527E88]/20 bg-white/35 px-4 py-3 backdrop-blur-sm"
			aria-labelledby="account-heading"
		>
			<h2 id="account-heading" class="mb-2 text-sm font-semibold text-[#144955]">Account</h2>
			{#if accountState === 'loading'}
				<p class="text-sm text-[#527E88]" role="status">Loading balance…</p>
			{:else if accountState === 'error'}
				<p class="text-sm text-[#144955]" role="alert">
					{accountError ?? 'Could not load account'}
				</p>
			{:else if accountState === 'ok' && accountData}
				<dl class="grid gap-2 text-sm sm:grid-cols-2">
					<div>
						<dt class="text-[#527E88]">Available to spend</dt>
						<dd class="font-semibold text-[#144955] tabular-nums">
							{priceFormatter.format(Number(accountData.availableToSpend))}
						</dd>
					</div>
					<div>
						<dt class="text-[#527E88]">Margin used (vs equity)</dt>
						<dd class="font-semibold text-[#144955] tabular-nums">
							{marginUsedRatio != null ? pctFormatter.format(marginUsedRatio) : '—'}
						</dd>
					</div>
					<div class="sm:col-span-2">
						<dt class="text-xs text-[#527E88]">Account equity</dt>
						<dd class="text-xs text-[#527E88] tabular-nums">
							{priceFormatter.format(Number(accountData.accountEquity))}
						</dd>
					</div>
				</dl>
			{/if}
		</section>
	{/if}

	<footer class="space-y-4">
		<div
			class="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between"
			role="group"
			aria-label="Total amount and leverage for opening a position"
		>
			<div class="min-w-0 flex-1 space-y-2" role="group" aria-labelledby="total-amount-label">
				<label
					id="total-amount-label"
					for="total-amount-usd-input"
					class="text-sm font-semibold text-[#144955]">Total amount (USD)</label
				>
				<div class="flex max-w-xs flex-col gap-1.5">
					<div class="relative">
						<span
							class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-[#527E88]"
							aria-hidden="true">$</span
						>
						<input
							id="total-amount-usd-input"
							type="text"
							inputmode="decimal"
							autocomplete="off"
							placeholder="0.00"
							value={totalAmountInputStr}
							oninput={(e) => {
								totalAmountInputStr = e.currentTarget.value;
								onTotalAmountFieldInput();
							}}
							class="w-full rounded-xl border border-[#527E88]/25 bg-white/70 py-2.5 pr-3 pl-7 text-sm font-medium text-[#144955] tabular-nums shadow-inner transition-[box-shadow,border-color] outline-none placeholder:text-[#527E88]/50 focus:border-[#22C1EE]/60 focus:ring-2 focus:ring-[#22C1EE]/25"
							aria-describedby={marketState === 'ok' && rowsBySymbol[symA] && rowsBySymbol[symB]
								? 'order-constraints-hint'
								: undefined}
						/>
					</div>
					<p class="text-xs text-[#527E88]">
						Notional for the pair; margin for this order is shown below.
					</p>
				</div>
			</div>

			<div class="flex min-w-0 shrink-0 flex-col gap-2 sm:max-w-[min(100%,280px)] sm:items-end">
				<div class="flex w-full max-w-[220px] items-center justify-between gap-2 sm:justify-end">
					<label id="leverage-slider-label" for="leverage-slider" class="text-sm font-semibold text-[#144955]"
						>Leverage</label
					>
					{#if marketState === 'ok' && effectiveMax != null && effectiveMax >= 1 && leverageInt != null}
						<span
							class="text-sm font-semibold tabular-nums text-[#144955]"
							aria-hidden="true">{leverageInt}×</span
						>
					{/if}
				</div>
				{#if marketState === 'loading'}
					<p id="leverage-slider" class="text-sm text-[#527E88]" role="status">Loading…</p>
				{:else if marketState === 'error'}
					<p id="leverage-slider" class="max-w-xs text-sm text-[#144955]" role="alert">
						{marketError ?? 'Unavailable'}
					</p>
				{:else if effectiveMax != null && effectiveMax >= 1 && leverageInt != null}
					<input
						id="leverage-slider"
						type="range"
						min={1}
						max={effectiveMax}
						step={1}
						value={leverageInt}
						disabled={marketState !== 'ok'}
						class={rangeTrackClass}
						aria-labelledby="leverage-slider-label"
						aria-valuemin={1}
						aria-valuemax={effectiveMax}
						aria-valuenow={leverageInt}
						aria-valuetext={`${leverageInt}× leverage`}
						aria-describedby={rowsBySymbol[symA] && rowsBySymbol[symB]
							? 'order-constraints-hint'
							: undefined}
						oninput={(e) => {
							leverageInt = Number(e.currentTarget.value);
						}}
					/>
				{:else}
					<p id="leverage-slider" class="text-sm text-[#527E88]">No leverage data</p>
				{/if}
			</div>
		</div>

		{#if totalAmountUsd != null && selectedLeverage != null && marginForOrderUsd != null}
			<div
				class="rounded-xl border border-[#527E88]/15 bg-white/30 px-3 py-2.5 text-sm backdrop-blur-sm"
				aria-labelledby="this-order-estimate-heading"
			>
				<h3 id="this-order-estimate-heading" class="mb-1.5 text-xs font-semibold tracking-wide text-[#527E88] uppercase">
					This order (estimate)
				</h3>
				<dl class="grid gap-2 sm:grid-cols-2">
					<div class="sm:col-span-2">
						<dt class="text-[#527E88]">Margin (this order)</dt>
						<dd class="font-semibold text-[#144955] tabular-nums">
							{priceFormatter.format(marginForOrderUsd)}
						</dd>
					</div>
					<div>
						<dt class="text-[#527E88]">Long {signal.tokenA}</dt>
						<dd class="font-semibold text-[#144955] tabular-nums">
							{estimateLongLegUsd != null ? priceFormatter.format(estimateLongLegUsd) : '—'}
						</dd>
					</div>
					<div>
						<dt class="text-[#527E88]">Short {signal.tokenB}</dt>
						<dd class="font-semibold text-[#144955] tabular-nums">
							{estimateShortLegUsd != null ? priceFormatter.format(estimateShortLegUsd) : '—'}
						</dd>
					</div>
				</dl>
				<p class="mt-1.5 text-xs text-[#527E88]">
					Not the same as account “margin used (vs equity)” above — that reflects your whole Pacifica account.
				</p>
			</div>
		{/if}

		{#if marketState === 'ok' && rowsBySymbol[symA] && rowsBySymbol[symB]}
			<p id="order-constraints-hint" class="space-y-1 text-xs text-[#527E88]">
				<span class="block text-[#144955]">
					Minimum entry is {priceFormatter.format(MIN_POSITION_ENTRY_TOTAL_USD)} total amount, with at
					least {priceFormatter.format(MIN_POSITION_LEG_NOTIONAL_USD)} on each leg (long
					{signal.tokenA}, short {signal.tokenB}).
				</span>
				{#if effectiveMinTotalUsd > MIN_POSITION_ENTRY_TOTAL_USD}
					<span class="block text-[#527E88]">
						For this allocation, total must be at least
						{priceFormatter.format(effectiveMinTotalUsd)} so both legs meet the per-leg minimum.
					</span>
				{/if}
				{#if totalBelowEffectiveMinimum}
					<button
						type="button"
						class="mt-1 text-left font-semibold text-[#22C1EE] underline decoration-[#22C1EE]/50 underline-offset-2"
						onclick={applyMinTotalAmount}
					>
						Set total amount to {priceFormatter.format(effectiveMinTotalUsd)}
					</button>
				{/if}
			</p>
		{/if}

		{#if slugActive}
			<div
				class="relative overflow-hidden rounded-xl border-2 border-[#22C1EE]/45 bg-linear-to-br from-[#22C1EE]/18 via-[#144955]/8 to-[#22C1EE]/10 px-4 py-3.5 shadow-sm ring-1 ring-[#22C1EE]/20"
				role="status"
				aria-live="polite"
			>
				<div
					class="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-[#22C1EE]/15 blur-2xl"
					aria-hidden="true"
				></div>
				<p class="relative text-lg font-extrabold leading-snug tracking-tight text-[#063845] sm:text-xl">
					You already have an active position for this pair in this browser.
				</p>
				<p class="relative mt-3">
					<a
						href={resolve('/positions')}
						aria-label="Open the Positions page to view your active pair position"
						class="inline-flex items-center gap-1 text-base font-extrabold text-[#0891b2] underline decoration-2 decoration-[#22C1EE]/70 underline-offset-[0.2em] transition-colors hover:text-[#0e7490] hover:decoration-[#22C1EE] focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#22C1EE] focus-visible:ring-offset-2"
					>
						View your position
					</a>
				</p>
			</div>
		{/if}

		{#if solanaWallet.connected && solanaWallet.pacificaAgentBinding}
			<p class="text-sm text-[#527E88]" role="status">Preparing Pacifica trading keys…</p>
		{/if}
		{#if solanaWallet.connected && !solanaWallet.pacificaAgentReady && solanaWallet.pacificaAgentError}
			<p class="text-sm text-[#144955]" role="alert">{solanaWallet.pacificaAgentError}</p>
		{/if}

		{#if tradeError}
			<p class="text-sm text-[#144955]" role="alert">{tradeError}</p>
		{/if}

		<div class="flex flex-wrap items-center gap-2">
			<!-- Dry-run still runs executePairTradeClient validation (product $100 / $10 per leg) before building signed bodies. -->
			<label class="flex cursor-pointer items-center gap-2 text-xs text-[#527E88]">
				<input
					type="checkbox"
					bind:checked={debugDryRunOpenPosition}
					class="size-3.5 rounded border-[#527E88]/40 text-[#22C1EE] focus:ring-[#22C1EE]"
				/>
				Debug: preview open-position requests (no API calls)
			</label>
		</div>

		{#if dryRunPreviewCalls != null && dryRunPreviewCalls.length > 0}
			<div
				class="max-h-[min(70vh,28rem)] w-full overflow-auto rounded-xl border border-amber-200/80 bg-amber-50/90 p-3 text-left shadow-sm"
				role="region"
				aria-label="Dry run: Pacifica proxy request bodies"
			>
				<p class="mb-2 text-xs font-semibold text-amber-900">
					Dry run — would POST to these app routes (not sent):
				</p>
				<ol class="list-decimal space-y-3 pl-4 text-xs text-amber-950">
					{#each dryRunPreviewCalls as call (call.step)}
						<li class="space-y-1">
							<div class="font-mono font-semibold">
								{call.step}. {call.method}
								{call.endpoint}
								<span class="font-sans font-normal text-amber-800">({call.action})</span>
							</div>
							<pre
								class="overflow-x-auto rounded-lg border border-amber-200/60 bg-white/80 p-2 text-[11px] leading-relaxed text-[#144955]"
							>{JSON.stringify(call.body, null, 2)}</pre>
						</li>
					{/each}
				</ol>
			</div>
		{/if}

		{#if solanaWallet.connected && marketState === 'ok' && !pricesReady && !slugActive}
			{#if priceLoadError}
				<p class="text-xs text-[#144955]" role="alert">{priceLoadError}</p>
			{:else}
				<p class="text-xs text-[#527E88]" role="status">
					Loading reference prices for order sizing…
				</p>
			{/if}
		{/if}

		<button
			type="button"
			disabled={openPositionDisabled}
			class={cn(
				'w-full rounded-full px-6 py-3.5 text-center text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(34,193,238,0.35)] transition-transform duration-150 md:w-auto',
				'bg-[#22C1EE] hover:scale-[1.02] hover:brightness-105',
				'focus-visible:ring-2 focus-visible:ring-[#22C1EE] focus-visible:ring-offset-2 focus-visible:ring-offset-white/80 focus-visible:outline-none',
				openPositionDisabled &&
					'pointer-events-none opacity-50 hover:scale-100 hover:brightness-100'
			)}
			aria-label="Open position for {pairSummary}, total amount {totalAmountUsd != null
				? priceFormatter.format(totalAmountUsd)
				: 'not set'}{selectedLeverage != null ? `, ${selectedLeverage}x leverage` : ''}"
			onclick={handleOpenPosition}
		>
			{tradeBusy
				? debugDryRunOpenPosition
					? 'Building preview…'
					: 'Opening…'
				: debugDryRunOpenPosition
					? 'Preview open-position requests'
					: 'Open position'}
		</button>
	</footer>
</article>
