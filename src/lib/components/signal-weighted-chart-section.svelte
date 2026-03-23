<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import SignalCandlestickChart from '$lib/components/signal-candlestick-chart.svelte';
	import { connectPacificaCandleFeed } from '$lib/signal/pacifica/candle-websocket.js';
	import {
		PACIFICA_DEFAULT_INTERVAL,
		PACIFICA_INITIAL_HISTORY_MS
	} from '$lib/signal/pacifica/types.js';
	import { WeightedCandleLiveStore } from '$lib/signal/pacifica/weighted-live-store.js';
	import type { PacificaCandle } from '$lib/signal/pacifica/types.js';
	import type {
		PacificaChartFeedPayload,
		SignalCandlestickPoint
	} from '$lib/signal/signal-detail.types.js';

	interface Props {
		initialCandlesticks: SignalCandlestickPoint[];
		chartError: string | null | undefined;
		feed: PacificaChartFeedPayload | null;
		allocationA: number;
		allocationB: number;
	}

	let { initialCandlesticks, chartError, feed, allocationA, allocationB }: Props = $props();

	/* Live series updated by WebSocket; re-sync when server props change (e.g. invalidate). */
	/* eslint-disable svelte/prefer-writable-derived */
	let candlesticks = $state<SignalCandlestickPoint[]>([]);
	let wsConnected = $state(false);

	$effect.pre(() => {
		candlesticks = initialCandlesticks;
	});
	/* eslint-enable svelte/prefer-writable-derived */
	let chartStatus = $derived.by(() => {
		if (chartError) return 'error' as const;
		if (candlesticks.length === 0) return 'empty' as const;
		return 'ready' as const;
	});

	let store: WeightedCandleLiveStore | null = null;
	let ws: ReturnType<typeof connectPacificaCandleFeed> | null = null;

	async function refetchLegsAndMerge(): Promise<void> {
		if (!store || !feed) return;
		const end = Date.now();
		const start = end - PACIFICA_INITIAL_HISTORY_MS;
		const q = new URLSearchParams({
			interval: PACIFICA_DEFAULT_INTERVAL,
			start_time: String(start),
			end_time: String(end)
		});

		const [resA, resB] = await Promise.all([
			fetch(`/api/pacifica/kline?symbol=${encodeURIComponent(feed.pacificaSymbolA)}&${q}`),
			fetch(`/api/pacifica/kline?symbol=${encodeURIComponent(feed.pacificaSymbolB)}&${q}`)
		]);

		if (!resA.ok || !resB.ok) return;

		const bodyA = (await resA.json()) as { success: boolean; data?: PacificaCandle[] };
		const bodyB = (await resB.json()) as { success: boolean; data?: PacificaCandle[] };
		if (!bodyA.success || !bodyB.success || !bodyA.data || !bodyB.data) return;

		store.seedFromRest(bodyA.data, bodyB.data);
		candlesticks = store.getPoints();
	}

	function applyCandle(c: PacificaCandle) {
		if (!store) return;
		store.applyWsCandle(c);
		candlesticks = store.getPoints();
	}

	onMount(() => {
		if (!feed || chartError) return;

		store = new WeightedCandleLiveStore(
			allocationA,
			allocationB,
			feed.pacificaSymbolA,
			feed.pacificaSymbolB
		);
		store.seedFromRest(feed.legA, feed.legB);
		candlesticks = store.getPoints();

		ws = connectPacificaCandleFeed(
			feed.wsUrl,
			feed.pacificaSymbolA,
			feed.pacificaSymbolB,
			{
				onCandle: applyCandle,
				onConnectionChange: (ok) => {
					wsConnected = ok;
				},
				onResync: () => {
					void refetchLegsAndMerge();
				}
			},
			{ interval: PACIFICA_DEFAULT_INTERVAL }
		);
	});

	onDestroy(() => {
		ws?.disconnect();
		ws = null;
		store = null;
	});
</script>

<section class="mb-6 min-w-0" aria-labelledby="chart-heading">
	<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
		<h2 id="chart-heading" class="text-sm font-semibold text-[#144955]">Weighted ratio (1h)</h2>
		{#if feed && !chartError}
			<p class="text-xs text-[#527E88] tabular-nums" aria-live="polite">
				{#if wsConnected}
					Live
				{:else}
					Connecting…
				{/if}
			</p>
		{/if}
	</div>

	{#if chartError}
		<div
			class="flex min-h-[280px] flex-col items-center justify-center gap-2 rounded-2xl border border-[#144955]/20 bg-white/30 px-4 py-8 text-center backdrop-blur-md"
			role="alert"
		>
			<p class="text-sm font-medium text-[#144955]">Chart unavailable</p>
			<p class="max-w-sm text-sm text-pretty text-[#527E88]">{chartError}</p>
		</div>
	{:else if chartStatus === 'empty'}
		<div
			class="flex min-h-[280px] items-center justify-center rounded-2xl border border-[rgba(82,126,136,0.2)] bg-white/40 px-4 backdrop-blur-md"
		>
			<p class="text-sm text-[#527E88]">
				No overlapping candle data for this pair in the selected window.
			</p>
		</div>
	{:else}
		<SignalCandlestickChart {candlesticks} status="ready" />
	{/if}
</section>
