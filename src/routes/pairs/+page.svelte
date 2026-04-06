<script lang="ts">
	import { navigating, page } from '$app/state';
	import type { PageData } from './$types';
	import { allocationFromCointCoefficient } from '$lib/pairs/allocation.js';
	import { pairLastUpdatedIso } from '$lib/pairs/last-updated.js';
	import { cn } from '$lib/utils.js';

	let { data }: { data: PageData } = $props();

	const formatter = new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short'
	});

	const numberFmt = new Intl.NumberFormat(undefined, {
		maximumFractionDigits: 4
	});

	function formatWhen(iso: string): string {
		return formatter.format(new Date(iso));
	}

	function formatPValue(p: number): string {
		if (p < 0.0001) return '<0.0001';
		return numberFmt.format(p);
	}

	const listNavigating = $derived(
		navigating.to != null &&
			navigating.to.url.pathname === '/pairs' &&
			page.url.pathname !== '/pairs'
	);
</script>

<svelte:head>
	<title>Pairs — Castor</title>
	<meta name="description" content="Cointegration pairs, funding, and stats" />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-2">
	<h1 class="text-lg font-semibold tracking-tight text-[#144955]">Pairs</h1>
	<p class="text-sm text-[#527E88]">
		Cointegration candidates from the pairs feed.
	</p>

	{#if listNavigating}
		<p class="text-sm text-[#527E88]" aria-live="polite">Loading pairs…</p>
		<ul class="space-y-3" aria-hidden="true">
			{#each [1, 2, 3] as i (i)}
				<li
					class="min-h-48 animate-pulse rounded-[24px] border border-[#22C1EE]/15 bg-white/40 shadow-[0_10px_30px_-10px_rgba(34,193,238,0.15)]"
				></li>
			{/each}
		</ul>
	{:else if !data.pairsConfigured}
		<div
			class="rounded-[24px] border border-[#22C1EE]/25 bg-white/50 p-4 text-sm text-[#144955] shadow-[0_10px_30px_-10px_rgba(34,193,238,0.2)]"
			role="status"
		>
			<p class="font-medium">Pairs feed not configured</p>
			<p class="mt-1 text-[#527E88]">{data.pairsError}</p>
		</div>
	{:else if data.pairsError}
		<div
			class="rounded-[24px] border border-[#22C1EE]/25 bg-white/50 p-4 text-sm text-[#144955] shadow-[0_10px_30px_-10px_rgba(34,193,238,0.2)]"
			role="alert"
		>
			<p class="font-medium">Could not load pairs</p>
			<p class="mt-1 text-[#527E88]">{data.pairsError}</p>
		</div>
	{:else if data.pairsEmpty}
		<p class="text-sm text-[#527E88]" role="status">No pairs in the feed right now.</p>
	{:else}
		<ul class="space-y-3" aria-label="Trading pairs">
			{#each data.pairs as pair (pair.symbol_a + ':' + pair.symbol_b)}
				{@const alloc = allocationFromCointCoefficient(pair.coint_coefficient)}
				{@const updated = pairLastUpdatedIso(pair, data.pairsMeta)}
				<li
					class={cn(
						'rounded-[24px] border border-[#22C1EE]/20 bg-white/50 p-4',
						'shadow-[0_10px_30px_-10px_rgba(34,193,238,0.2)]',
						'transition-transform duration-150 hover:scale-[1.02] hover:brightness-[1.02]'
					)}
				>
					<div class="flex min-w-0 flex-col gap-3">
						<div class="flex min-w-0 flex-wrap items-center gap-2 gap-y-2">
							<span
								class="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full bg-[#22C1EE]/15 px-2.5 py-1 text-sm font-semibold text-[#144955] ring-1 ring-[#22C1EE]/35"
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
								<span class="truncate text-[#22C1EE]">{pair.symbol_a}</span>
								<span class="shrink-0 text-[#527E88]">·</span>
								<span class="shrink-0">{alloc.pctLong}%</span>
								<span
									class="shrink-0 text-[10px] font-medium tracking-wide text-[#527E88] uppercase"
									>Long</span
								>
							</span>
							<span class="shrink-0 text-[#527E88]">/</span>
							<span
								class="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full bg-[#144955]/10 px-2.5 py-1 text-sm font-semibold text-[#144955] ring-1 ring-[#144955]/25"
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
								<span class="truncate text-[#144955]">{pair.symbol_b}</span>
								<span class="shrink-0 text-[#527E88]">·</span>
								<span class="shrink-0">{alloc.pctShort}%</span>
								<span
									class="shrink-0 text-[10px] font-medium tracking-wide text-[#527E88] uppercase"
									>Short</span
								>
							</span>
						</div>

						<div class="flex min-w-0 flex-col gap-2 sm:flex-row sm:gap-6">
							<div class="min-w-0 flex-1 space-y-1">
								<p class="text-xs font-medium text-[#527E88]">Categories · long</p>
								<div class="flex flex-wrap gap-1.5">
									{#each pair.market_a.categories as cat (cat)}
										<span
											class="rounded-full border border-[#22C1EE]/35 bg-white/40 px-2 py-0.5 text-xs text-[#144955]"
											>{cat}</span
										>
									{/each}
								</div>
							</div>
							<div class="min-w-0 flex-1 space-y-1">
								<p class="text-xs font-medium text-[#527E88]">Categories · short</p>
								<div class="flex flex-wrap gap-1.5">
									{#each pair.market_b.categories as cat (cat)}
										<span
											class="rounded-full border border-[#144955]/25 bg-white/40 px-2 py-0.5 text-xs text-[#144955]"
											>{cat}</span
										>
									{/each}
								</div>
							</div>
						</div>

						<div class="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 sm:gap-x-4 sm:gap-y-1">
							<p class="text-[#144955]">
								<span class="text-[#527E88]">ADF stat </span>{numberFmt.format(pair.adf_statistic)}
							</p>
							<p class="text-[#144955]">
								<span class="text-[#527E88]">ADF p-value </span>{formatPValue(pair.adf_p_value)}
							</p>
							<p class="text-[#144955]">
								<span class="text-[#527E88]">Zero crossings </span>{pair.zero_crossings}
							</p>
							<p class="text-[#144955]">
								<span class="text-[#527E88]">Mean crossing time </span>{numberFmt.format(
									pair.mean_crossing_time
								)}
							</p>
						</div>

						<p class="text-xs text-[#527E88]">Last updated {formatWhen(updated)}</p>

						<div class="grid grid-cols-1 gap-3 border-t border-[#22C1EE]/15 pt-3 sm:grid-cols-2">
							<div class="min-w-0 space-y-1.5 rounded-[16px] bg-[#22C1EE]/5 px-3 py-2">
								<p class="text-xs font-semibold text-[#144955]">{pair.symbol_a} · funding</p>
								<p class="text-xs break-all text-[#144955]">
									<span class="text-[#527E88]">Current </span>{pair.market_a.funding}
								</p>
								<p class="text-xs break-all text-[#144955]">
									<span class="text-[#527E88]">Next </span>{pair.market_a.next_funding}
								</p>
							</div>
							<div class="min-w-0 space-y-1.5 rounded-[16px] bg-[#144955]/5 px-3 py-2">
								<p class="text-xs font-semibold text-[#144955]">{pair.symbol_b} · funding</p>
								<p class="text-xs break-all text-[#144955]">
									<span class="text-[#527E88]">Current </span>{pair.market_b.funding}
								</p>
								<p class="text-xs break-all text-[#144955]">
									<span class="text-[#527E88]">Next </span>{pair.market_b.next_funding}
								</p>
							</div>
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
