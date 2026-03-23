<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import AppHeader from '$lib/components/app-header.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div
	class="flex min-h-screen flex-col bg-gradient-to-b from-[#E8F7FC] via-[#F2FAFD] to-[#EEF8FB] font-sans text-[#144955] antialiased"
>
	<AppHeader />
	<main class="w-full flex-1 px-4 py-6">
		{@render children()}
	</main>
</div>
