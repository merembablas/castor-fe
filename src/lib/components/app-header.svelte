<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { cn } from '$lib/utils.js';

	const links = [
		{ path: '/' as const, label: 'Live signals', match: (p: string) => p === '/' },
		{ path: '/positions' as const, label: 'Positions', match: (p: string) => p === '/positions' },
		{ path: '/archives' as const, label: 'Archives', match: (p: string) => p === '/archives' }
	] as const;

	let pathname = $derived(page.url.pathname);
</script>

<header
	class={cn(
		'sticky top-0 z-50 border-b border-[#22C1EE]/25',
		'bg-[rgba(255,255,255,0.4)] backdrop-blur-md',
		'shadow-[0_10px_30px_-10px_rgba(34,193,238,0.15)]'
	)}
>
	<div
		class="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
	>
		<p class="text-lg font-semibold tracking-tight text-[#144955]">Castor</p>
		<nav aria-label="Main" class="flex flex-wrap gap-2">
			{#each links as { path, label, match } (path)}
				<a
					href={resolve(path)}
					class={cn(
						'inline-flex min-h-11 min-w-[44px] items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-transform duration-150',
						'hover:scale-[1.02] hover:brightness-[1.03] focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#22C1EE]',
						match(pathname)
							? 'bg-[#B9E9F6] text-[#144955] ring-2 ring-[#22C1EE]/40'
							: 'border border-[#22C1EE]/50 bg-white/30 text-[#527E88]'
					)}
				>
					{label}
				</a>
			{/each}
		</nav>
	</div>
</header>
