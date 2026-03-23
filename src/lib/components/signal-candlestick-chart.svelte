<script lang="ts">
	import type { IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
	import type { SignalCandlestickPoint } from '$lib/signal/signal-detail.types.js';

	interface Props {
		candlesticks: SignalCandlestickPoint[];
		/** Parent may gate error/empty; `ready` draws or updates the series. */
		status?: 'ready' | 'loading';
	}

	let { candlesticks, status = 'ready' }: Props = $props();

	let container = $state<HTMLDivElement | null>(null);
	let seriesApi = $state<ISeriesApi<'Candlestick'> | null>(null);
	let chartApi = $state<IChartApi | null>(null);
	let hasFitted = $state(false);

	/** Stable while length stays >0 so WS bar updates do not tear down the chart. */
	const hasBars = $derived(candlesticks.length > 0);

	function mapBars(points: SignalCandlestickPoint[]) {
		return points.map((b) => ({
			time: b.time as UTCTimestamp,
			open: b.open,
			high: b.high,
			low: b.low,
			close: b.close
		}));
	}

	$effect(() => {
		if (!container || !hasBars || status !== 'ready') {
			chartApi?.remove();
			chartApi = null;
			seriesApi = null;
			hasFitted = false;
			return;
		}

		let cancelled = false;

		void (async () => {
			const { createChart, ColorType, CandlestickSeries } = await import('lightweight-charts');

			if (cancelled || !container) return;

			const chart = createChart(container, {
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

			if (cancelled) {
				chart.remove();
				return;
			}

			chartApi = chart;
			seriesApi = series;
		})();

		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		const pts = candlesticks;
		const s = seriesApi;
		const c = chartApi;
		if (!s || !c || pts.length === 0) return;
		s.setData(mapBars(pts));
		if (!hasFitted) {
			c.timeScale().fitContent();
			hasFitted = true;
		}
	});
</script>

<div
	class="signal-chart-root w-full min-w-0 overflow-hidden rounded-2xl border border-[rgba(82,126,136,0.2)] bg-white/40 backdrop-blur-md"
	aria-label="Candlestick price chart"
>
	{#if status === 'loading'}
		<p class="flex min-h-[280px] items-center justify-center px-4 text-sm text-[#527E88]">
			Loading chart…
		</p>
	{:else if !hasBars}
		<p class="flex min-h-[280px] items-center justify-center px-4 text-sm text-[#527E88]">
			No chart data available.
		</p>
	{:else}
		<div bind:this={container} class="h-[min(55vw,320px)] min-h-[280px] w-full"></div>
	{/if}
</div>
