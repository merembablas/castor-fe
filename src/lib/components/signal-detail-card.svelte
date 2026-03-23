<script lang="ts">
	import SignalCandlestickChart from '$lib/components/signal-candlestick-chart.svelte';
	import type { SignalDetailViewModel } from '$lib/signal/signal-detail.types.js';
	import { cn } from '$lib/utils.js';

	interface Props {
		signal: SignalDetailViewModel;
	}

	let { signal }: Props = $props();

	type PositionPreset = '10' | '20' | '30' | 'custom';

	let positionPreset = $state<PositionPreset>('10');
	let customAmount = $state('');

	const priceFormatter = new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 2
	});

	const generatedLabel = $derived.by(() => {
		const d = new Date(signal.generatedAt);
		if (Number.isNaN(d.getTime())) return signal.generatedAt;
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

	function setPositionPreset(preset: PositionPreset) {
		positionPreset = preset;
	}

	function handleOpenPosition() {
		if (positionUsd === null) return;
		// Placeholder until trade flow exists
	}
</script>

<article
	class={cn(
		'mx-auto w-full max-w-3xl overflow-x-hidden',
		'rounded-[24px] border border-white/60 bg-white/40 p-6 shadow-[0_10px_30px_-10px_rgba(34,193,238,0.2)] backdrop-blur-md md:p-8'
	)}
	aria-labelledby="signal-heading"
>
	<header class="mb-6 space-y-3">
		<div class="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-4">
			<p class="text-sm font-medium tracking-wide text-[#527E88]">Trading signal</p>
			<p class="text-sm tabular-nums text-[#527E88]/90">
				Generated
				<time datetime={signal.generatedAt} class="font-medium text-[#144955]">{generatedLabel}</time>
			</p>
		</div>
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

	<section class="mb-6 min-w-0" aria-labelledby="chart-heading">
		<h2 id="chart-heading" class="mb-3 text-sm font-semibold text-[#144955]">Price</h2>
		<SignalCandlestickChart candlesticks={signal.candlesticks} />
	</section>

	<section class="mb-6 space-y-2" aria-labelledby="entry-heading">
		<h2 id="entry-heading" class="text-sm font-semibold text-[#144955]">Entry price</h2>
		<p class="text-lg font-medium tabular-nums text-[#144955]">
			{priceFormatter.format(signal.entryPrice)}
		</p>
	</section>

	<section class="mb-8 space-y-2" aria-labelledby="desc-heading">
		<h2 id="desc-heading" class="text-sm font-semibold text-[#144955]">Description</h2>
		<p class="text-pretty text-[#527E88] leading-relaxed">{signal.description}</p>
	</section>

	<footer class="space-y-4">
		<div class="space-y-2" role="group" aria-labelledby="position-size-label">
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
					<label for="position-custom-usd" class="text-xs font-medium text-[#527E88]">Amount (USD)</label>
					<div class="relative">
						<span
							class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#527E88]"
							aria-hidden="true">$</span>
						<input
							id="position-custom-usd"
							type="number"
							inputmode="decimal"
							min="0.01"
							step="any"
							placeholder="0.00"
							bind:value={customAmount}
							class="w-full rounded-xl border border-[#527E88]/25 bg-white/70 py-2.5 pl-7 pr-3 text-sm font-medium tabular-nums text-[#144955] shadow-inner outline-none transition-[box-shadow,border-color] placeholder:text-[#527E88]/50 focus:border-[#22C1EE]/60 focus:ring-2 focus:ring-[#22C1EE]/25"
						/>
					</div>
				</div>
			{/if}
		</div>
		<button
			type="button"
			disabled={!canOpenPosition}
			class={cn(
				'w-full rounded-full px-6 py-3.5 text-center text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(34,193,238,0.35)] transition-transform duration-150 md:w-auto',
				'bg-[#22C1EE] hover:scale-[1.02] hover:brightness-105',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C1EE] focus-visible:ring-offset-2 focus-visible:ring-offset-white/80',
				!canOpenPosition && 'pointer-events-none opacity-50 hover:scale-100 hover:brightness-100'
			)}
			aria-label="Open position for {pairSummary}, size {positionUsd != null ? priceFormatter.format(positionUsd) : 'not set'}"
			onclick={handleOpenPosition}
		>
			Open position
		</button>
	</footer>
</article>
