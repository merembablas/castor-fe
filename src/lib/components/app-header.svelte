<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { cn } from '$lib/utils.js';
	import { onMount } from 'svelte';
	import { shortenPublicKey, solanaWallet } from '$lib/solana/wallet.svelte.js';

	const links = [
		{ path: '/' as const, label: 'Live signals', match: (p: string) => p === '/' },
		{ path: '/positions' as const, label: 'Positions', match: (p: string) => p === '/positions' },
		{ path: '/archives' as const, label: 'Archives', match: (p: string) => p === '/archives' }
	] as const;

	let pathname = $derived(page.url.pathname);

	onMount(() => {
		solanaWallet.ensureInit();
	});
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
		<div class="hidden min-h-0 min-w-0 flex-1 sm:block" aria-hidden="true"></div>
		<div
			class="flex w-full flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-none sm:flex-row sm:items-center sm:justify-end sm:gap-3"
		>
			<nav aria-label="Main" class="flex flex-wrap gap-2 sm:justify-end">
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
			<div
				class="flex w-full min-w-0 flex-col items-stretch gap-2 sm:w-auto sm:min-w-44 sm:items-end"
			>
				{#if solanaWallet.connected && solanaWallet.publicKey}
					<div class="flex w-full flex-wrap items-center justify-end gap-2">
						<span
							class="inline-flex min-h-11 max-w-full items-center rounded-full border border-[#22C1EE]/40 bg-white/30 px-4 py-2 text-sm font-medium text-[#144955]"
							title={solanaWallet.publicKey.toBase58()}
						>
							{shortenPublicKey(solanaWallet.publicKey)}
						</span>
						<button
							type="button"
							class={cn(
								'inline-flex min-h-11 min-w-[44px] shrink-0 items-center justify-center rounded-full border border-[#22C1EE]/50 bg-[#B9E9F6]/80 px-4 py-2 text-sm font-medium text-[#144955]',
								'transition-transform duration-150 hover:scale-[1.02] hover:brightness-[1.03]',
								'focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#22C1EE]'
							)}
							aria-label="Disconnect Solana wallet"
							onclick={() => solanaWallet.disconnect()}
						>
							Disconnect
						</button>
					</div>
				{:else}
					<button
						type="button"
						class={cn(
							'inline-flex min-h-11 min-w-[44px] w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white sm:w-auto',
							'bg-[#22C1EE] shadow-[0_10px_30px_-10px_rgba(34,193,238,0.2)]',
							'transition-transform duration-150 hover:scale-[1.02] hover:brightness-[1.03]',
							'focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#22C1EE]',
							(solanaWallet.connecting || solanaWallet.walletNotAvailable) && 'opacity-60'
						)}
						disabled={solanaWallet.connecting || solanaWallet.walletNotAvailable}
						aria-label="Connect Phantom Solana wallet"
						onclick={() => solanaWallet.connect()}
					>
						{solanaWallet.connecting ? 'Connecting…' : 'Connect wallet'}
					</button>
				{/if}
				{#if solanaWallet.initialized && solanaWallet.walletNotAvailable && !solanaWallet.connected}
					<p class="text-right text-xs text-[#527E88]" role="status">
						Phantom extension not detected. Install Phantom to connect.
					</p>
				{/if}
				{#if solanaWallet.connectError}
					<p class="text-right text-xs text-[#527E88]" role="status" aria-live="polite">
						{solanaWallet.connectError}
					</p>
				{/if}
			</div>
		</div>
	</div>
</header>
