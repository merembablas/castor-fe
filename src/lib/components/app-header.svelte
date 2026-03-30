<script lang="ts">
	import { cn } from '$lib/utils.js';
	import {
		MAIN_NAV_DRAWER_ID,
		MAIN_NAV_MENU_BUTTON_ID,
		mainNav
	} from '$lib/nav/main-nav.svelte.js';
	import { onMount } from 'svelte';
	import { shortenPublicKey, solanaWallet } from '$lib/solana/wallet.svelte.js';

	onMount(() => {
		solanaWallet.ensureInit();
	});

	function toggleMenu() {
		mainNav.toggle();
	}
</script>

<header
	class={cn(
		'sticky top-0 z-50 border-b border-[#22C1EE]/25',
		'bg-[rgba(255,255,255,0.4)] backdrop-blur-md',
		'shadow-[0_10px_30px_-10px_rgba(34,193,238,0.15)]'
	)}
>
	<div class="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4">
		<div class="flex w-full items-center justify-between gap-3">
			<button
				type="button"
				id={MAIN_NAV_MENU_BUTTON_ID}
				class={cn(
					'inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-[#22C1EE]/50 bg-white/30 text-[#144955]',
					'transition-transform duration-150 hover:scale-[1.02] hover:brightness-[1.03]',
					'focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#22C1EE]'
				)}
				aria-expanded={mainNav.open}
				aria-controls={MAIN_NAV_DRAWER_ID}
				aria-label={mainNav.open ? 'Close menu' : 'Open menu'}
				onclick={toggleMenu}
			>
				<span class="sr-only">{mainNav.open ? 'Close menu' : 'Open menu'}</span>
				<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					{#if mainNav.open}
						<path
							d="M6 6l12 12M18 6L6 18"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
					{:else}
						<path
							d="M5 7h14M5 12h14M5 17h14"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
					{/if}
				</svg>
			</button>

			<div class="min-h-0 min-w-0 flex-1" aria-hidden="true"></div>

			<div class="flex min-w-0 shrink-0 flex-col items-stretch gap-2 sm:min-w-44 sm:items-end">
				{#if solanaWallet.connected && solanaWallet.publicKey}
					<div class="flex flex-wrap items-center justify-end gap-2">
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
							'inline-flex min-h-11 min-w-[44px] items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white',
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
