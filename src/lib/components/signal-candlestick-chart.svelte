<script lang="ts">
	import { onMount } from 'svelte';
	import type { IChartApi } from 'lightweight-charts';
	import type { UTCTimestamp } from 'lightweight-charts';
	import type { SignalCandlestickPoint } from '$lib/signal/signal-detail.types.js';

	interface Props {
		candlesticks: SignalCandlestickPoint[];
	}

	let { candlesticks }: Props = $props();

	let container = $state<HTMLDivElement | null>(null);

	onMount(() => {
		let cancelled = false;
		let chart: IChartApi | undefined;

		void (async () => {
			if (!container || candlesticks.length === 0) return;

			const { createChart, ColorType, CandlestickSeries } = await import('lightweight-charts');

			if (cancelled || !container) return;

			chart = createChart(container, {
				autoSize: true,
				layout: {
					background: { type: ColorType.Solid, color: 'transparent' },
					textColor: '#527E88'
				},
				grid: {
					vertLines: { color: 'rgba(20, 73, 85, 0.08)' },
					horzLines: { color: 'rgba(20, 73, 85, 0.08)' }
				},
				rightPriceScale: { borderColor: 'rgba(82, 126, 136, 0.25)' },
				timeScale: { borderColor: 'rgba(82, 126, 136, 0.25)' }
			});

			if (cancelled) {
				chart.remove();
				chart = undefined;
				return;
			}

			const series = chart.addSeries(CandlestickSeries, {
				upColor: '#22C1EE',
				downColor: '#144955',
				borderVisible: true,
				wickVisible: true,
				borderUpColor: '#22C1EE',
				borderDownColor: '#144955',
				wickUpColor: '#22C1EE',
				wickDownColor: '#144955'
			});

			series.setData(
				candlesticks.map((b) => ({
					time: b.time as UTCTimestamp,
					open: b.open,
					high: b.high,
					low: b.low,
					close: b.close
				}))
			);

			chart.timeScale().fitContent();
		})();

		return () => {
			cancelled = true;
			chart?.remove();
		};
	});
</script>

<div
	class="signal-chart-root w-full min-w-0 overflow-hidden rounded-2xl border border-[rgba(82,126,136,0.2)] bg-white/40 backdrop-blur-md"
	aria-label="Candlestick price chart"
>
	{#if candlesticks.length === 0}
		<p class="flex min-h-[280px] items-center justify-center px-4 text-sm text-[#527E88]">
			No chart data available.
		</p>
	{:else}
		<div bind:this={container} class="h-[min(55vw,320px)] min-h-[280px] w-full"></div>
	{/if}
</div>
