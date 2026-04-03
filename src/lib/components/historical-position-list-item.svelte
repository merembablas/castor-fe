<script lang="ts">
	import {
		displayTokenLabelsForHistoricalPair,
		fundingPaidForegroundClass,
		type HistoricalClosedPairPosition
	} from '$lib/positions/historical-pair-positions.js';
	import { cn } from '$lib/utils.js';

	let { record }: { record: HistoricalClosedPairPosition } = $props();

	const labels = $derived(displayTokenLabelsForHistoricalPair(record));

	const dateFormatter = new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short'
	});

	const sizeFormatter = new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});

	function formatWhen(ms: number): string {
		return dateFormatter.format(new Date(ms));
	}

	function formatSignedUsd(value: number): string {
		if (value === 0) {
			return sizeFormatter.format(0);
		}
		const sign = value > 0 ? '+' : '−';
		const abs = Math.abs(value);
		const body = new Intl.NumberFormat(undefined, {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(abs);
		return `${sign}${body}`;
	}

	const realizedPositive = $derived(record.realizedPnlUsd > 0);
	const realizedNegative = $derived(record.realizedPnlUsd < 0);
	const realizedNeutral = $derived(!realizedPositive && !realizedNegative);

	const realizedUsdStr = $derived(formatSignedUsd(record.realizedPnlUsd));
	const fundingUsdStr = $derived(formatSignedUsd(record.fundingPaidUsd));
	const fundingClass = $derived(fundingPaidForegroundClass(record.fundingPaidUsd));
</script>

<li>
	<article
		class={cn(
			'flex flex-col gap-3 rounded-[24px] border border-[#22C1EE]/20 bg-white/50 p-4 sm:flex-row sm:items-stretch sm:justify-between',
			'shadow-[0_10px_30px_-10px_rgba(34,193,238,0.2)]',
			'transition-transform duration-150 hover:scale-[1.02] hover:brightness-[1.02]'
		)}
	>
		<div class="min-w-0 flex-1 space-y-2">
			<div class="flex flex-wrap items-center gap-2 gap-y-2">
				<span
					class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#22C1EE]/15 px-2.5 py-1 text-sm font-semibold text-[#144955] ring-1 ring-[#22C1EE]/35"
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
					<span class="truncate text-[#22C1EE]">{labels.tokenALabel}</span>
					<span class="text-[#527E88]">·</span>
					<span>{record.longAllocationPercent}%</span>
					<span class="text-[10px] font-medium tracking-wide text-[#527E88] uppercase">Long</span>
				</span>
				<span class="text-[#527E88]">/</span>
				<span
					class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#144955]/10 px-2.5 py-1 text-sm font-semibold text-[#144955] ring-1 ring-[#144955]/25"
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
					<span class="truncate text-[#144955]">{labels.tokenBLabel}</span>
					<span class="text-[#527E88]">·</span>
					<span>{record.shortAllocationPercent}%</span>
					<span class="text-[10px] font-medium tracking-wide text-[#527E88] uppercase">Short</span>
				</span>
			</div>
			<p class="text-xs text-[#527E88]">
				<span class="font-medium text-[#144955]">Opened</span>
				{formatWhen(record.openedAt)}
			</p>
			<div class="space-y-0.5">
				<p
					class={cn(
						'text-base font-semibold tabular-nums',
						realizedPositive && 'text-emerald-600',
						realizedNegative && 'text-red-600',
						realizedNeutral && 'text-[#527E88]'
					)}
				>
					<span class="text-sm font-medium text-[#144955]">Realized P&L</span>
					<span class="mx-1.5 font-normal text-[#527E88]">·</span>
					<span>{realizedUsdStr}</span>
				</p>
			</div>
		</div>
		<div
			class="flex min-w-0 shrink-0 flex-col justify-center gap-2 border-t border-[#22C1EE]/15 pt-3 text-xs sm:border-t-0 sm:border-l sm:pl-4 sm:pt-0"
		>
			<p class="tabular-nums text-[#527E88]">
				<span class="font-medium text-[#144955]">Closed</span>
				<span class="mx-1.5">·</span>
				<span>{formatWhen(record.closedAt)}</span>
			</p>
			<p class="tabular-nums">
				<span class="font-medium text-[#144955]">Funding paid</span>
				<span class="mx-1.5 text-[#527E88]">·</span>
				<span class={cn('text-sm font-semibold', fundingClass)}>{fundingUsdStr}</span>
			</p>
		</div>
	</article>
</li>
