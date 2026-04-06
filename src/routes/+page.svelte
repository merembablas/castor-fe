<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import { activePairSlugs } from '$lib/live-signals/active-pair-slugs.svelte.js';
	import LiveSignalRow from '$lib/live-signals/live-signal-row.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const listNavigating = $derived(
		navigating.to != null &&
			navigating.to.url.pathname === '/' &&
			page.url.pathname !== '/'
	);

	afterNavigate(({ to }) => {
		if (to?.url.pathname === '/') activePairSlugs.refresh();
	});
</script>

<svelte:head>
	<title>Live signals — Castor</title>
	<meta name="description" content="New pair trading signals" />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-2">
	{#if listNavigating}
		<p class="text-sm text-[#527E88]" aria-live="polite">Loading signals…</p>
		<ul class="space-y-3" aria-hidden="true">
			{#each [1, 2, 3] as i (i)}
				<li
					class="h-28 animate-pulse rounded-[24px] border border-[#22C1EE]/15 bg-white/40 shadow-[0_10px_30px_-10px_rgba(34,193,238,0.15)]"
				></li>
			{/each}
		</ul>
	{:else if !data.liveSignalsConfigured}
		<div
			class="rounded-[24px] border border-[#22C1EE]/25 bg-white/50 p-4 text-sm text-[#144955] shadow-[0_10px_30px_-10px_rgba(34,193,238,0.2)]"
			role="status"
		>
			<p class="font-medium">Signals feed not configured</p>
			<p class="mt-1 text-[#527E88]">{data.liveSignalsError}</p>
		</div>
	{:else if data.liveSignalsError}
		<div
			class="rounded-[24px] border border-[#22C1EE]/25 bg-white/50 p-4 text-sm text-[#144955] shadow-[0_10px_30px_-10px_rgba(34,193,238,0.2)]"
			role="alert"
		>
			<p class="font-medium">Could not load signals</p>
			<p class="mt-1 text-[#527E88]">{data.liveSignalsError}</p>
		</div>
	{:else if data.liveSignalsEmpty}
		<p class="text-sm text-[#527E88]" role="status">No signals right now. Check back soon.</p>
	{:else}
		{#if data.newsFeedError}
			<p class="mb-2 text-sm text-[#527E88]" role="status">
				News feed unavailable ({data.newsFeedError}). Signals below are unchanged.
			</p>
		{/if}
		<ul class="space-y-3" aria-label="Live signals">
			{#each data.liveSignals as signal (signal.slug)}
				<LiveSignalRow {signal} newsBySymbol={data.newsBySymbol} />
			{/each}
		</ul>
	{/if}
</div>
