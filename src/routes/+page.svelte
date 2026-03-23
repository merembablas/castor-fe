<script lang="ts">
	import { resolve } from '$app/paths';
	import { DUMMY_LIVE_SIGNALS } from '$lib/live-signals/live-signals.js';
	import { cn } from '$lib/utils.js';

	const formatter = new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short'
	});

	function formatWhen(iso: string): string {
		return formatter.format(new Date(iso));
	}
</script>

<svelte:head>
	<title>Live signals — Castor</title>
	<meta name="description" content="New pair trading signals" />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-2">
	<ul class="space-y-3" aria-label="Live signals">
		{#each DUMMY_LIVE_SIGNALS as signal (signal.slug)}
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
					<p class="mt-2 text-xs text-[#527E88]">Generated {formatWhen(signal.generatedAt)}</p>
					<p class="mt-1 line-clamp-1 text-sm text-[#144955]">{signal.description}</p>
				</a>
			</li>
		{/each}
	</ul>
</div>
