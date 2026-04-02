<script lang="ts">
	import type { OpenPosition } from '$lib/positions/open-position.js';
	import { cn } from '$lib/utils.js';

	let {
		position,
		closing = false,
		closeDisabled = false,
		onClose
	}: {
		position: OpenPosition;
		closing?: boolean;
		closeDisabled?: boolean;
		onClose?: () => void | Promise<void>;
	} = $props();

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

	const pnlPending = $derived(position.pnlPending === true);
	const pnlPositive = $derived(!pnlPending && position.unrealizedPnlUsd > 0);
	const pnlNegative = $derived(!pnlPending && position.unrealizedPnlUsd < 0);
	const pnlNeutral = $derived(
		pnlPending || (!pnlPositive && !pnlNegative)
	);

	function formatWhen(iso: string): string {
		return dateFormatter.format(new Date(iso));
	}

	function formatPercent(value: number): string {
		const sign = value > 0 ? '+' : value < 0 ? '−' : '';
		const abs = Math.abs(value);
		return `${sign}${abs.toFixed(1)}%`;
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

	const pnlPercentStr = $derived(formatPercent(position.unrealizedPnlPercent));
	const pnlUsdStr = $derived(formatSignedUsd(position.unrealizedPnlUsd));
	const netFundingUsdStr = $derived(formatSignedUsd(position.netFundingPaidUsd));

	const closeLabel = $derived(
		closing
			? `Closing position for ${position.tokenALabel} long and ${position.tokenBLabel} short`
			: `Close position for ${position.tokenALabel} long and ${position.tokenBLabel} short`
	);

	const closeBlocked = $derived(closeDisabled || closing || onClose == null);
</script>

<li>
	<article
		class={cn(
			'flex flex-col gap-3 rounded-[24px] border border-[#22C1EE]/20 bg-white/50 p-4 sm:flex-row sm:items-center sm:justify-between',
			'shadow-[0_10px_30px_-10px_rgba(34,193,238,0.2)]',
			'transition-transform duration-150 hover:scale-[1.02] hover:brightness-[1.02]'
		)}
	>
		<div class="min-w-0 flex-1 space-y-2">
			<div class="flex flex-wrap items-center gap-2 gap-y-2">
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
					<span class="text-[#22C1EE]">{position.tokenALabel}</span>
					<span class="text-[#527E88]">·</span>
					<span>{position.allocationA}%</span>
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
					<span class="text-[#144955]">{position.tokenBLabel}</span>
					<span class="text-[#527E88]">·</span>
					<span>{position.allocationB}%</span>
					<span class="text-[10px] font-medium tracking-wide text-[#527E88] uppercase">Short</span>
				</span>
			</div>
			{#if position.generatedAt}
				<p class="text-xs text-[#527E88]">
					<span class="font-medium text-[#144955]">Generated</span>
					{formatWhen(position.generatedAt)}
				</p>
			{/if}
			<p class="text-xs text-[#527E88]">
				<span class="font-medium text-[#144955]">Opened</span>
				{formatWhen(position.openedAt)}
			</p>
			<p class="text-xs text-[#527E88]">
				Size <span class="font-medium text-[#144955]">{sizeFormatter.format(position.notionalUsd)}</span>
			</p>
			<div class="space-y-0.5">
				<p
					class={cn(
						'text-base font-semibold tabular-nums',
						pnlPositive && 'text-emerald-600',
						pnlNegative && 'text-red-600',
						pnlNeutral && 'text-[#527E88]'
					)}
					aria-live={pnlPending ? 'polite' : undefined}
				>
					<span class="text-sm font-medium text-[#144955]">Unrealized P&L</span>
					{#if pnlPending}
						<span class="mx-1.5 font-normal text-[#527E88]">·</span>
						<span class="font-normal">Updating live…</span>
					{:else}
						<span class="mx-1.5 font-normal text-[#527E88]">·</span>
						<span>{pnlPercentStr}</span>
						<span class="mx-1.5 font-normal text-[#527E88]">·</span>
						<span>{pnlUsdStr}</span>
					{/if}
				</p>
				<p class="text-xs tabular-nums text-[#527E88]">
					<span class="font-medium text-[#144955]">Net funding paid</span>
					<span class="mx-1.5">·</span>
					<span>{netFundingUsdStr}</span>
				</p>
			</div>
		</div>
		<div class="flex shrink-0 sm:pl-4">
			<button
				type="button"
				disabled={closeBlocked}
				class={cn(
					'inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#22C1EE]/50 bg-white/30 px-4 py-2 text-sm font-medium text-[#144955]',
					'transition-transform duration-150 hover:scale-[1.02] hover:brightness-[1.03]',
					'focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#22C1EE] sm:w-auto',
					closeBlocked && 'pointer-events-none opacity-50 hover:scale-100 hover:brightness-100'
				)}
				aria-label={closeLabel}
				aria-busy={closing ? true : undefined}
				onclick={() => {
					if (onClose) void onClose();
				}}
			>
				{closing ? 'Closing…' : 'Close position'}
			</button>
		</div>
	</article>
</li>
