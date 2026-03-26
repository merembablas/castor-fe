<script lang="ts">
	import { onMount } from 'svelte';
	import SignalWeightedChartSection from '$lib/components/signal-weighted-chart-section.svelte';
	import {
		buildLeverageOptions,
		effectiveMaxLeverage
	} from '$lib/signal/pacifica/leverage-options.js';
	import { toPacificaSymbol } from '$lib/signal/pacifica/symbol.js';
	import { solanaWallet } from '$lib/solana/wallet.svelte.js';
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

	type PositionPreset = '10' | '20' | '30' | 'custom';

	let positionPreset = $state<PositionPreset>('10');
	let customAmount = $state('');

	let marketState = $state<MarketLoadState>('idle');
	let marketError = $state<string | null>(null);
	let rowsBySymbol = $state<Record<string, MarketRowPublic>>({});

	let leverageSelectStr = $state('');

	let accountState = $state<AccountLoadState>('idle');
	let accountError = $state<string | null>(null);
	let accountData = $state<AccountPayload | null>(null);

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

	const positionUsd = $derived.by(() => {
		if (positionPreset === '10') return 10;
		if (positionPreset === '20') return 20;
		if (positionPreset === '30') return 30;
		const n = Number.parseFloat(customAmount.replace(',', '.'));
		if (!Number.isFinite(n) || n <= 0) return null;
		return n;
	});

	const canOpenPosition = $derived(positionUsd !== null);

	const pairSummary = $derived(
		`${signal.tokenA} ${signal.allocationA}% / ${signal.tokenB} ${signal.allocationB}%`
	);

	const effectiveMax = $derived.by(() => {
		const ra = rowsBySymbol[symA];
		const rb = rowsBySymbol[symB];
		if (!ra || !rb) return null;
		return effectiveMaxLeverage(ra.maxLeverage, rb.maxLeverage);
	});

	const leverageOptions = $derived(
		effectiveMax == null ? [] : buildLeverageOptions(effectiveMax)
	);

	const selectedLeverage = $derived(
		leverageSelectStr ? Number(leverageSelectStr) : null
	);

	const strictMinOrderUsd = $derived.by(() => {
		const ra = rowsBySymbol[symA];
		const rb = rowsBySymbol[symB];
		if (!ra || !rb) return null;
		const na = Number(ra.minOrderSize);
		const nb = Number(rb.minOrderSize);
		if (!Number.isFinite(na) || !Number.isFinite(nb)) return null;
		return Math.max(na, nb);
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
		const opts = leverageOptions;
		if (opts.length === 0) {
			leverageSelectStr = '';
			return;
		}
		const cur = Number(leverageSelectStr);
		if (!leverageSelectStr || !opts.includes(cur)) {
			leverageSelectStr = String(opts[opts.length - 1]);
		}
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

	function setPositionPreset(preset: PositionPreset) {
		positionPreset = preset;
	}

	function handleOpenPosition() {
		if (positionUsd === null) return;
		// Placeholder until trade flow exists
	}

	const selectShellClass = cn(
		'min-w-[5.5rem] rounded-full border border-[#527E88]/25 bg-white/70 px-3 py-2 text-sm font-semibold text-[#144955] tabular-nums',
		'shadow-inner outline-none transition-[box-shadow,border-color]',
		'focus:border-[#22C1EE]/60 focus:ring-2 focus:ring-[#22C1EE]/25',
		'disabled:cursor-not-allowed disabled:opacity-50'
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
				<p class="text-sm text-[#144955]" role="alert">{accountError ?? 'Could not load account'}</p>
			{:else if accountState === 'ok' && accountData}
				<dl class="grid gap-2 text-sm sm:grid-cols-2">
					<div>
						<dt class="text-[#527E88]">Available to spend</dt>
						<dd class="font-semibold tabular-nums text-[#144955]">
							{priceFormatter.format(Number(accountData.availableToSpend))}
						</dd>
					</div>
					<div>
						<dt class="text-[#527E88]">Margin used (vs equity)</dt>
						<dd class="font-semibold tabular-nums text-[#144955]">
							{marginUsedRatio != null ? pctFormatter.format(marginUsedRatio) : '—'}
						</dd>
					</div>
					<div class="sm:col-span-2">
						<dt class="text-xs text-[#527E88]">Account equity</dt>
						<dd class="text-xs tabular-nums text-[#527E88]">
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
			aria-label="Position size and leverage"
		>
			<div class="min-w-0 flex-1 space-y-2" role="group" aria-labelledby="position-size-label">
				<p id="position-size-label" class="text-sm font-semibold text-[#144955]">Position size</p>
				<div class="flex flex-wrap gap-2">
					<button
						type="button"
						class={cn(
							'rounded-full border px-4 py-2 text-sm font-semibold tabular-nums transition-colors',
							positionPreset === '10'
								? 'border-[#22C1EE] bg-[#22C1EE]/15 text-[#144955]'
								: 'border-[#527E88]/25 bg-white/50 text-[#527E88] hover:border-[#22C1EE]/40'
						)}
						aria-pressed={positionPreset === '10'}
						onclick={() => setPositionPreset('10')}
					>
						$10
					</button>
					<button
						type="button"
						class={cn(
							'rounded-full border px-4 py-2 text-sm font-semibold tabular-nums transition-colors',
							positionPreset === '20'
								? 'border-[#22C1EE] bg-[#22C1EE]/15 text-[#144955]'
								: 'border-[#527E88]/25 bg-white/50 text-[#527E88] hover:border-[#22C1EE]/40'
						)}
						aria-pressed={positionPreset === '20'}
						onclick={() => setPositionPreset('20')}
					>
						$20
					</button>
					<button
						type="button"
						class={cn(
							'rounded-full border px-4 py-2 text-sm font-semibold tabular-nums transition-colors',
							positionPreset === '30'
								? 'border-[#22C1EE] bg-[#22C1EE]/15 text-[#144955]'
								: 'border-[#527E88]/25 bg-white/50 text-[#527E88] hover:border-[#22C1EE]/40'
						)}
						aria-pressed={positionPreset === '30'}
						onclick={() => setPositionPreset('30')}
					>
						$30
					</button>
					<button
						type="button"
						class={cn(
							'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
							positionPreset === 'custom'
								? 'border-[#22C1EE] bg-[#22C1EE]/15 text-[#144955]'
								: 'border-[#527E88]/25 bg-white/50 text-[#527E88] hover:border-[#22C1EE]/40'
						)}
						aria-pressed={positionPreset === 'custom'}
						onclick={() => setPositionPreset('custom')}
					>
						Custom
					</button>
				</div>
				{#if positionPreset === 'custom'}
					<div class="flex max-w-xs flex-col gap-1.5">
						<label for="position-custom-usd" class="text-xs font-medium text-[#527E88]"
							>Amount (USD)</label
						>
						<div class="relative">
							<span
								class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-[#527E88]"
								aria-hidden="true">$</span
							>
							<input
								id="position-custom-usd"
								type="number"
								inputmode="decimal"
								min="0.01"
								step="any"
								placeholder="0.00"
								bind:value={customAmount}
								class="w-full rounded-xl border border-[#527E88]/25 bg-white/70 py-2.5 pr-3 pl-7 text-sm font-medium text-[#144955] tabular-nums shadow-inner transition-[box-shadow,border-color] outline-none placeholder:text-[#527E88]/50 focus:border-[#22C1EE]/60 focus:ring-2 focus:ring-[#22C1EE]/25"
							/>
						</div>
					</div>
				{/if}
			</div>

			<div class="flex shrink-0 flex-col gap-2 sm:items-end">
				<label for="leverage-select" class="text-sm font-semibold text-[#144955]">Leverage</label>
				{#if marketState === 'loading'}
					<p id="leverage-select" class="text-sm text-[#527E88]" role="status">Loading…</p>
				{:else if marketState === 'error'}
					<p id="leverage-select" class="max-w-xs text-sm text-[#144955]" role="alert">
						{marketError ?? 'Unavailable'}
					</p>
				{:else if leverageOptions.length > 0}
					<select
						id="leverage-select"
						bind:value={leverageSelectStr}
						class={selectShellClass}
						aria-describedby={strictMinOrderUsd != null ? 'order-constraints-hint' : undefined}
					>
						{#each leverageOptions as lv (lv)}
							<option value={String(lv)}>{lv}x</option>
						{/each}
					</select>
				{:else}
					<p id="leverage-select" class="text-sm text-[#527E88]">No leverage data</p>
				{/if}
			</div>
		</div>

		{#if strictMinOrderUsd != null && marketState === 'ok'}
			<p id="order-constraints-hint" class="text-xs text-[#527E88]">
				Stricter min order (USD, across legs): {priceFormatter.format(strictMinOrderUsd)} · Lot step {symA} /
				{symB}: {rowsBySymbol[symA]?.lotSize} / {rowsBySymbol[symB]?.lotSize}
			</p>
		{/if}

		<button
			type="button"
			disabled={!canOpenPosition}
			class={cn(
				'w-full rounded-full px-6 py-3.5 text-center text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(34,193,238,0.35)] transition-transform duration-150 md:w-auto',
				'bg-[#22C1EE] hover:scale-[1.02] hover:brightness-105',
				'focus-visible:ring-2 focus-visible:ring-[#22C1EE] focus-visible:ring-offset-2 focus-visible:ring-offset-white/80 focus-visible:outline-none',
				!canOpenPosition && 'pointer-events-none opacity-50 hover:scale-100 hover:brightness-100'
			)}
			aria-label="Open position for {pairSummary}, size {positionUsd != null
				? priceFormatter.format(positionUsd)
				: 'not set'}{selectedLeverage != null ? `, ${selectedLeverage}x leverage` : ''}"
			onclick={handleOpenPosition}
		>
			Open position
		</button>
	</footer>
</article>
