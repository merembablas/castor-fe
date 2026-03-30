<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { cn } from '$lib/utils.js';
	import { mainNavLinks } from '$lib/nav/main-nav-links.js';
	import {
		MAIN_NAV_DRAWER_ID,
		MAIN_NAV_MENU_BUTTON_ID,
		mainNav
	} from '$lib/nav/main-nav.svelte.js';
	import { tick } from 'svelte';

	let pathname = $derived(page.url.pathname);

	$effect(() => {
		if (!mainNav.open) return;
		const prev = document.documentElement.style.overflow;
		document.documentElement.style.overflow = 'hidden';
		return () => {
			document.documentElement.style.overflow = prev;
		};
	});

	$effect(() => {
		if (!mainNav.open) return;
		function onKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				e.preventDefault();
				closeMenu();
			}
		}
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	});

	$effect(() => {
		if (!mainNav.open) return;
		void tick().then(() => {
			document.querySelector<HTMLAnchorElement>(`#${MAIN_NAV_DRAWER_ID} a[href]`)?.focus();
		});
	});

	function closeMenu() {
		mainNav.close();
		tick().then(() => {
			document.getElementById(MAIN_NAV_MENU_BUTTON_ID)?.focus();
		});
	}
</script>

{#if mainNav.open}
	<div class="fixed inset-0 z-[200]">
		<button
			type="button"
			class="absolute inset-0 bg-black/20 backdrop-blur-sm"
			aria-label="Close menu"
			onclick={closeMenu}
		></button>
		<div
			id={MAIN_NAV_DRAWER_ID}
			class={cn(
				'absolute top-0 left-0 flex h-full max-h-[100dvh] w-[min(100vw,20rem)] flex-col border-r border-[#22C1EE]/25',
				'bg-[rgba(255,255,255,0.4)] backdrop-blur-[12px]',
				'shadow-[0_10px_30px_-10px_rgba(34,193,238,0.2)]'
			)}
			role="dialog"
			aria-modal="true"
			aria-label="Main navigation"
		>
			<div class="flex items-center justify-between border-b border-[#22C1EE]/20 px-4 py-3">
				<p class="text-sm font-semibold text-[#144955]">Navigate</p>
				<button
					type="button"
					class={cn(
						'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[#22C1EE]/50 bg-white/30 text-sm font-medium text-[#144955]',
						'transition-transform duration-150 hover:scale-[1.02] hover:brightness-[1.03]',
						'focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#22C1EE]'
					)}
					aria-label="Close menu"
					onclick={closeMenu}
				>
					×
				</button>
			</div>
			<nav aria-label="Pages" class="flex min-h-0 flex-1 flex-col overflow-hidden">
				<ul class="flex flex-col gap-2 overflow-y-auto p-4" role="list">
					{#each mainNavLinks as { path, label, match } (path)}
						<li>
							<a
								href={resolve(path)}
								class={cn(
									'flex min-h-11 w-full items-center rounded-full px-4 py-2 text-sm font-medium transition-transform duration-150',
									'hover:scale-[1.02] hover:brightness-[1.03] focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#22C1EE]',
									match(pathname)
										? 'bg-[#B9E9F6] text-[#144955] ring-2 ring-[#22C1EE]/40'
										: 'border border-[#22C1EE]/50 bg-white/30 text-[#527E88]'
								)}
								onclick={closeMenu}
							>
								{label}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
		</div>
	</div>
{/if}
