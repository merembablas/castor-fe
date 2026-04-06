<script lang="ts">
	import { resolve } from '$app/paths';
	import { navigating, page } from '$app/state';
	import type { PageData } from './$types';
	import { cn } from '$lib/utils.js';

	let { data }: { data: PageData } = $props();

	const formatter = new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short'
	});

	function formatWhen(iso: string): string {
		return formatter.format(new Date(iso));
	}

	const listNavigating = $derived(
		navigating.to != null &&
			navigating.to.url.pathname === '/archives' &&
			page.url.pathname !== '/archives'
	);
</script>

<svelte:head>
	<title>Archives — Castor</title>
	<meta name="description" content="Archived pair trading signals" />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-2">
	{#if listNavigating}
		<p class="text-sm text-[#527E88]" aria-live="polite">Loading archives…</p>
		<ul class="space-y-3" aria-hidden="true">
			{#each [1, 2, 3] as i (i)}
				<li
					class="h-28 animate-pulse rounded-[24px] border border-[#22C1EE]/15 bg-white/40 shadow-[0_10px_30px_-10px_rgba(34,193,238,0.15)]"
				></li>
			{/each}
		</ul>
	{:else if !data.archivesConfigured}
		<div
			class="rounded-[24px] border border-[#22C1EE]/25 bg-white/50 p-4 text-sm text-[#144955] shadow-[0_10px_30px_-10px_rgba(34,193,238,0.2)]"
			role="status"
		>
			<p class="font-medium">Archives feed not configured</p>
			<p class="mt-1 text-[#527E88]">{data.archivesError}</p>
		</div>
	{:else if data.archivesError}
		<div
			class="rounded-[24px] border border-[#22C1EE]/25 bg-white/50 p-4 text-sm text-[#144955] shadow-[0_10px_30px_-10px_rgba(34,193,238,0.2)]"
			role="alert"
		>
			<p class="font-medium">Could not load archives</p>
			<p class="mt-1 text-[#527E88]">{data.archivesError}</p>
		</div>
	{:else if data.archivesEmpty}
		<p class="text-sm text-[#527E88]" role="status">No archived signals yet.</p>
	{:else}
		<ul class="space-y-3" aria-label="Archived signals">
			{#each data.archivedSignals as signal (signal.slug)}
				<li>
					<a
						href={resolve('/signal/[slug]', { slug: signal.slug })}
						class={cn(
							'block rounded-[24px] border border-[#22C1EE]/20 bg-white/50 p-4',
							'shadow-[0_10px_30px_-10px_rgba(34,193,238,0.2)]',
							'transition-transform duration-150 hover:scale-[1.02] hover:brightness-[1.02]',
							'focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#22C1EE]'
						)}
					>
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
								<span class="text-[#22C1EE]">{signal.tokenALabel}</span>
								<span class="text-[#527E88]">·</span>
								<span>{signal.allocationA}%</span>
								<span class="text-[10px] font-medium tracking-wide text-[#527E88] uppercase"
									>Long</span
								>
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
								<span class="text-[#144955]">{signal.tokenBLabel}</span>
								<span class="text-[#527E88]">·</span>
								<span>{signal.allocationB}%</span>
								<span class="text-[10px] font-medium tracking-wide text-[#527E88] uppercase"
									>Short</span
								>
							</span>
						</div>
						<p class="mt-2 text-xs text-[#527E88]">
							Generated {formatWhen(signal.generatedAt)}
						</p>
						<p class="mt-0.5 text-xs text-[#527E88]">
							Archived {formatWhen(signal.archivedAt)}
						</p>
						<p class="mt-1 line-clamp-3 text-sm text-[#144955]">{signal.description}</p>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
