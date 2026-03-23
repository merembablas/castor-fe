<script lang="ts">
	import SignalDetailCard from '$lib/components/signal-detail-card.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.signal.tokenA}:{data.signal.allocationA} — {data.signal.tokenB}:{data.signal.allocationB} · Signal</title>
	<meta name="description" content="Signal detail for {data.signal.slug}" />
</svelte:head>

<div class="min-h-dvh bg-linear-to-b from-[#E8F7FB] to-[#D4EEF5] px-4 py-10 md:px-6 md:py-14">
	<SignalDetailCard signal={data.signal} />
</div>
