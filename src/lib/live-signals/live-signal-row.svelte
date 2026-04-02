<script lang="ts">
	import { resolve } from '$app/paths';
	import { activePairSlugs } from '$lib/live-signals/active-pair-slugs.svelte.js';
	import type { LiveSignal } from '$lib/live-signals/live-signals.js';
	import type { NewsSummaryItem } from '$lib/symbol-news/news-api.types.js';
	import { teaserOneSentence } from '$lib/symbol-news/normalize-news.js';
	import { cn } from '$lib/utils.js';

	interface Props {
		signal: LiveSignal;
		newsBySymbol: Record<string, NewsSummaryItem[]>;
	}

	let { signal, newsBySymbol }: Props = $props();

	let dialogEl = $state<HTMLDialogElement | null>(null);
	let prevFocusEl = $state<HTMLElement | null>(null);

	const whenFmt = new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short'
	});
	function formatWhen(iso: string): string {
		return whenFmt.format(new Date(iso));
	}

	const longKey = $derived(signal.tokenALabel.trim().toUpperCase());
	const shortKey = $derived(signal.tokenBLabel.trim().toUpperCase());
	const longItems = $derived(newsBySymbol[longKey] ?? []);
	const shortItems = $derived(newsBySymbol[shortKey] ?? []);
	const canOpenNewsOverlay = $derived(longItems.length > 0 || shortItems.length > 0);

	const slugKey = $derived(signal.slug.trim());
	const hasOpenPositionInCache = $derived(
		activePairSlugs.hydrated && activePairSlugs.activeSlugs.has(slugKey)
	);

	const longTeaser = $derived(longItems[0]?.summary ? teaserOneSentence(longItems[0].summary) : '');
	const shortTeaser = $derived(
		shortItems[0]?.summary ? teaserOneSentence(shortItems[0].summary) : ''
	);

	function openNewsOverlay(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		prevFocusEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		dialogEl?.showModal();
	}

	function closeNewsOverlay() {
		dialogEl?.close();
	}

	function onDialogClose() {
		prevFocusEl?.focus();
		prevFocusEl = null;
	}

	function onDialogClick(e: MouseEvent) {
		if (e.target === dialogEl) closeNewsOverlay();
	}
</script>

<li
	class={cn(
		'rounded-[24px] border border-[#22C1EE]/20 bg-white/50',
		'shadow-[0_10px_30px_-10px_rgba(34,193,238,0.2)]',
		'transition-transform duration-150 hover:scale-[1.02] hover:brightness-[1.02]',
		'overflow-hidden'
	)}
>
	<a
		href={resolve('/signal/[slug]', { slug: signal.slug })}
		class={cn(
			'block min-w-0 p-4',
			'focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#22C1EE]'
		)}
	>
		<div class="flex flex-wrap items-center gap-2 gap-y-2">
			<span
				class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#22C1EE]/15 px-2.5 py-1 text-sm font-semibold text-[#144955] ring-1 ring-[#22C1EE]/35"
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
				<span class="truncate text-[#22C1EE]">{signal.tokenALabel}</span>
				<span class="shrink-0 text-[#527E88]">·</span>
				<span class="shrink-0">{signal.allocationA}%</span>
				<span class="shrink-0 text-[10px] font-medium tracking-wide text-[#527E88] uppercase"
					>Long</span
				>
			</span>
			<span class="text-[#527E88]">/</span>
			<span
				class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#144955]/10 px-2.5 py-1 text-sm font-semibold text-[#144955] ring-1 ring-[#144955]/25"
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
				<span class="truncate text-[#144955]">{signal.tokenBLabel}</span>
				<span class="shrink-0 text-[#527E88]">·</span>
				<span class="shrink-0">{signal.allocationB}%</span>
				<span class="shrink-0 text-[10px] font-medium tracking-wide text-[#527E88] uppercase"
					>Short</span
				>
			</span>
			{#if hasOpenPositionInCache}
				<span
					class="inline-flex max-w-full items-center gap-1 rounded-full border border-[#F59E0B]/40 bg-[#FFEDD5]/90 px-2.5 py-1 text-xs font-semibold text-[#78350F] shadow-[0_6px_18px_-8px_rgba(245,158,11,0.28)]"
					aria-label="This pair is tracked as an open position in your app"
					title="Tracked open position (from saved pairs)"
				>
					<svg
						class="h-3.5 w-3.5 shrink-0 text-[#D97706]"
						viewBox="0 0 16 16"
						fill="none"
						aria-hidden="true"
					>
						<path
							d="M3 13V6a1 1 0 011-1h1l1.5-2h3L11 5h1a1 1 0 011 1v8"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M3 13h10"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
						/>
					</svg>
					<span class="shrink-0 tracking-tight">Position open</span>
				</span>
			{/if}
		</div>
		<p class="mt-2 text-xs text-[#527E88]">Generated {formatWhen(signal.generatedAt)}</p>
		<p class="mt-1 line-clamp-3 text-sm text-[#144955]">{signal.description}</p>

		{#if longTeaser || shortTeaser}
			<div class="mt-3 space-y-1.5 border-t border-[#22C1EE]/15 pt-3">
				<p class="text-[10px] font-semibold tracking-wide text-[#527E88] uppercase">News (ELFA AI)</p>
				{#if longTeaser}
					<p class="text-xs leading-snug text-[#144955]">
						<span class="font-semibold text-[#22C1EE]">{signal.tokenALabel}:</span>
						<span class="text-[#527E88]"> {longTeaser}</span>
					</p>
				{/if}
				{#if shortTeaser}
					<p class="text-xs leading-snug text-[#144955]">
						<span class="font-semibold text-[#144955]">{signal.tokenBLabel}:</span>
						<span class="text-[#527E88]"> {shortTeaser}</span>
					</p>
				{/if}
			</div>
		{/if}
	</a>

	{#if canOpenNewsOverlay}
		<div
			class="flex justify-end border-t border-[#22C1EE]/15 bg-white/40 px-4 py-2.5 backdrop-blur-md"
		>
			<button
				type="button"
				class={cn(
					'rounded-full border border-[#22C1EE]/60 bg-[#B9E9F6]/40 px-4 py-1.5',
					'text-xs font-semibold text-[#144955]',
					'transition-transform duration-150 hover:scale-[1.02] hover:brightness-[1.02]',
					'focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#22C1EE]'
				)}
				onclick={openNewsOverlay}
			>
				All news summaries
			</button>
		</div>
	{/if}

	<dialog
		bind:this={dialogEl}
		class={cn(
			'fixed top-1/2 left-1/2 z-50 m-0 max-h-[min(85vh,640px)] w-[min(100vw-1.5rem,28rem)] max-w-[calc(100vw-1.5rem)]',
			'-translate-x-1/2 -translate-y-1/2',
			'rounded-[24px] border border-[#22C1EE]/25 bg-white/95 p-0',
			'shadow-[0_10px_30px_-10px_rgba(34,193,238,0.35)]',
			'backdrop:bg-[#144955]/30 backdrop:backdrop-blur-md'
		)}
		aria-labelledby="signal-news-dialog-title"
		onclick={onDialogClick}
		onclose={onDialogClose}
	>
		<div class="flex max-h-[min(85vh,640px)] flex-col">
			<div
				class="flex shrink-0 items-center justify-between gap-2 border-b border-[#22C1EE]/15 bg-white/90 px-4 py-3 backdrop-blur-md"
			>
				<h2
					id="signal-news-dialog-title"
					class="text-sm font-semibold tracking-tight text-[#144955]"
				>
					News · {signal.tokenALabel} / {signal.tokenBLabel}
				</h2>
				<button
					type="button"
					class={cn(
						'rounded-full border border-[#22C1EE]/50 px-3 py-1 text-xs font-semibold text-[#144955]',
						'transition-transform duration-150 hover:scale-[1.02] hover:brightness-[1.02]',
						'focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#22C1EE]'
					)}
					onclick={closeNewsOverlay}
				>
					Close
				</button>
			</div>
			<div class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-3">
				{#if longItems.length > 0}
					<section class="mb-4" aria-label="Long leg news">
						<h3 class="mb-2 text-xs font-semibold tracking-wide text-[#22C1EE] uppercase">
							{signal.tokenALabel}
						</h3>
						<ul class="space-y-3">
							{#each longItems as item, idx (`long-${idx}`)}
								<li class="rounded-2xl border border-[#22C1EE]/15 bg-[#B9E9F6]/15 p-3">
									<p class="text-sm leading-snug text-[#144955]">{item.summary}</p>
									{#if item.sourceLinks.length > 0}
										<ul class="mt-2 flex flex-wrap gap-2">
											{#each item.sourceLinks as link, j (link)}
												<li>
													<a
														href={link}
														target="_blank"
														rel="noopener noreferrer"
														class="text-xs font-medium text-[#22C1EE] underline underline-offset-2 hover:brightness-110"
													>
														Source {j + 1}
													</a>
												</li>
											{/each}
										</ul>
									{/if}
								</li>
							{/each}
						</ul>
					</section>
				{/if}
				{#if shortItems.length > 0}
					<section aria-label="Short leg news">
						<h3 class="mb-2 text-xs font-semibold tracking-wide text-[#144955] uppercase">
							{signal.tokenBLabel}
						</h3>
						<ul class="space-y-3">
							{#each shortItems as item, idx (`s-${idx}`)}
								<li class="rounded-2xl border border-[#144955]/15 bg-[#144955]/5 p-3">
									<p class="text-sm leading-snug text-[#144955]">{item.summary}</p>
									{#if item.sourceLinks.length > 0}
										<ul class="mt-2 flex flex-wrap gap-2">
											{#each item.sourceLinks as link, j (link)}
												<li>
													<a
														href={link}
														target="_blank"
														rel="noopener noreferrer"
														class="text-xs font-medium text-[#22C1EE] underline underline-offset-2 hover:brightness-110"
													>
														Source {j + 1}
													</a>
												</li>
											{/each}
										</ul>
									{/if}
								</li>
							{/each}
						</ul>
					</section>
				{/if}
			</div>
		</div>
	</dialog>
</li>
