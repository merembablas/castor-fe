<script lang="ts">
	import { browser } from '$app/environment';
	import PositionListItem from '$lib/components/position-list-item.svelte';
	import { buildOpenPositionFromMergedRow } from '$lib/positions/build-open-position-row.js';
	import type { MergedPairPositionRow } from '$lib/positions/active-pairs-positions-merge.js';
	import {
		mergeActivePairsWithPacificaPositions,
		resolveActiveSlug
	} from '$lib/positions/active-pairs-positions-merge.js';
	import { positionsRowsToSymbolMap } from '$lib/positions/pacifica-position-normalize.js';
	import {
		readActivePairPositions,
		removeActivePairPosition,
		writeActivePairPositions
	} from '$lib/signal/active-pair-positions.js';
	import {
		closePairPositionClient,
		fetchMarketSizingRows
	} from '$lib/signal/pacifica/close-pair-position-client.js';
	import { connectPacificaMarkPriceCandleFeed } from '$lib/signal/pacifica/mark-price-candle-websocket.js';
	import { loadPacificaAgent } from '$lib/signal/pacifica/pacifica-agent-storage.js';
	import type { PacificaPositionRow } from '$lib/signal/pacifica/rest-types.js';
	import { solanaWallet } from '$lib/solana/wallet.svelte.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type PageLoadState = 'idle' | 'loading' | 'ok' | 'error';

	let loadState = $state<PageLoadState>('idle');
	let loadError = $state<string | null>(null);
	let mergedRows = $state<MergedPairPositionRow[]>([]);
	let marksBySymbol = $state<Record<string, number>>({});
	let closingSlug = $state<string | null>(null);
	let closeError = $state<string | null>(null);

	const openPositions = $derived(
		mergedRows.map((row) => buildOpenPositionFromMergedRow(row, marksBySymbol))
	);

	const symbolsForMarks = $derived.by(() => {
		const out: string[] = [];
		for (const r of mergedRows) {
			if (!out.includes(r.symA)) out.push(r.symA);
			if (!out.includes(r.symB)) out.push(r.symB);
		}
		return out.sort();
	});

	async function refreshPositions(): Promise<void> {
		if (!browser) return;
		const pk = solanaWallet.publicKey;
		if (!pk) {
			loadState = 'idle';
			loadError = null;
			mergedRows = [];
			return;
		}

		const addr = pk.toBase58();
		loadState = 'loading';
		loadError = null;

		const stored = readActivePairPositions();
		const validStored = stored.filter((e) => resolveActiveSlug(e) != null);

		let rowsJson: PacificaPositionRow[];
		try {
			const q = new URLSearchParams({ account: addr });
			const res = await fetch(`/api/pacifica/positions?${q}`);
			const j = (await res.json()) as
				| { success: true; data: PacificaPositionRow[] }
				| { success: false; error?: string };
			if (!res.ok || !j.success) {
				throw new Error(
					typeof (j as { error?: string }).error === 'string'
						? (j as { error: string }).error
						: 'Could not load positions'
				);
			}
			rowsJson = j.data;
		} catch (e) {
			loadState = 'error';
			loadError = e instanceof Error ? e.message : 'Positions request failed';
			mergedRows = [];
			return;
		}

		const map = positionsRowsToSymbolMap(rowsJson);
		const { reconciledStored, rows } = mergeActivePairsWithPacificaPositions(validStored, map);

		writeActivePairPositions(reconciledStored);

		mergedRows = rows;
		loadState = 'ok';
	}

	async function handleClosePair(row: MergedPairPositionRow): Promise<void> {
		closeError = null;
		const pk = solanaWallet.publicKey;
		if (!pk) {
			closeError = 'Connect your wallet first.';
			return;
		}
		if (!solanaWallet.pacificaAgentReady) {
			closeError =
				'Pacifica trading keys are not ready. Open a signal, approve the bind signature, and try again.';
			return;
		}
		const agent = loadPacificaAgent(pk.toBase58());
		if (!agent?.bound) {
			closeError =
				'Pacifica trading keys are not ready. Approve the bind signature when connecting, or reconnect your wallet.';
			return;
		}

		closingSlug = row.slug;
		try {
			const { rowLong, rowShort } = await fetchMarketSizingRows(row.symA, row.symB);
			await closePairPositionClient({
				account: pk.toBase58(),
				agentSecretKeyBase58: agent.secretKeyBase58,
				row,
				rowLong,
				rowShort
			});
			// Tracked open pairs: only `castor:activePairPositions` is slug-keyed for this product (audit).
			removeActivePairPosition(row.slug);
			await refreshPositions();
		} catch (e) {
			closeError =
				e instanceof Error ? e.message : 'Something went wrong while closing the position.';
		} finally {
			closingSlug = null;
		}
	}

	$effect(() => {
		solanaWallet.ensureInit();
	});

	$effect(() => {
		if (!browser) return;

		const connected = solanaWallet.connected;
		const pk = solanaWallet.publicKey;

		if (!connected || !pk) {
			loadState = 'idle';
			loadError = null;
			mergedRows = [];
			marksBySymbol = {};
			return;
		}

		let cancelled = false;

		void refreshPositions().then(() => {
			if (cancelled) return;
		});

		const interval = setInterval(() => {
			if (!cancelled) void refreshPositions();
		}, 45_000);

		const onVis = () => {
			if (document.visibilityState === 'visible' && !cancelled) void refreshPositions();
		};
		document.addEventListener('visibilitychange', onVis);

		return () => {
			cancelled = true;
			clearInterval(interval);
			document.removeEventListener('visibilitychange', onVis);
		};
	});

	$effect(() => {
		if (!browser) return;
		if (symbolsForMarks.length === 0) {
			marksBySymbol = {};
			return;
		}

		const wsUrl = data.pacificaWsUrl;
		marksBySymbol = {};
		const marksLocal: Record<string, number> = {};

		const ctrl = connectPacificaMarkPriceCandleFeed(wsUrl, symbolsForMarks, {
			onMark(symbol, markUsd) {
				marksLocal[symbol] = markUsd;
				marksBySymbol = { ...marksLocal };
			}
		});

		return () => ctrl.disconnect();
	});
</script>

<svelte:head>
	<title>Positions — Castor</title>
	<meta name="description" content="Open pair trading positions and unrealized P&L" />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-2">
	{#if !solanaWallet.initialized}
		<p class="rounded-[24px] border border-[#22C1EE]/20 bg-white/50 p-4 text-sm text-[#527E88] shadow-[0_10px_30px_-10px_rgba(34,193,238,0.2)]">
			Loading wallet…
		</p>
	{:else if !solanaWallet.connected || !solanaWallet.publicKey}
		<p class="rounded-[24px] border border-[#22C1EE]/20 bg-white/50 p-4 text-sm text-[#527E88] shadow-[0_10px_30px_-10px_rgba(34,193,238,0.2)]">
			Connect your Solana wallet to see open pair positions from Pacifica.
		</p>
	{:else if loadState === 'loading' && mergedRows.length === 0}
		<p class="rounded-[24px] border border-[#22C1EE]/20 bg-white/50 p-4 text-sm text-[#527E88] shadow-[0_10px_30px_-10px_rgba(34,193,238,0.2)]">
			Loading positions…
		</p>
	{:else if loadState === 'error'}
		<p
			class="rounded-[24px] border border-red-200 bg-white/50 p-4 text-sm text-red-700 shadow-[0_10px_30px_-10px_rgba(34,193,238,0.2)]"
			role="alert"
		>
			{loadError ?? 'Could not load positions.'}
		</p>
	{:else if openPositions.length === 0}
		<p class="rounded-[24px] border border-[#22C1EE]/20 bg-white/50 p-4 text-sm text-[#527E88] shadow-[0_10px_30px_-10px_rgba(34,193,238,0.2)]">
			No open pair positions. Open a trade from a signal to track it here.
		</p>
	{:else}
		{#if closeError}
			<p
				class="rounded-[24px] border border-red-200 bg-white/50 p-4 text-sm text-red-700 shadow-[0_10px_30px_-10px_rgba(34,193,238,0.2)]"
				role="alert"
			>
				{closeError}
			</p>
		{/if}
		<ul class="space-y-3" aria-label="Open positions">
			{#each openPositions as position (position.id)}
				{@const merged = mergedRows.find((r) => r.slug === position.id)}
				<PositionListItem
					{position}
					closing={closingSlug === position.id}
					closeDisabled={!solanaWallet.pacificaAgentReady}
					onClose={merged ? () => handleClosePair(merged) : undefined}
				/>
			{/each}
		</ul>
	{/if}
</div>
