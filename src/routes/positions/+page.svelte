<script lang="ts">
	import PositionListItem from '$lib/components/position-list-item.svelte';
	import { DUMMY_POSITIONS } from '$lib/positions/dummy-positions.js';
</script>

<svelte:head>
	<title>Positions — Castor</title>
	<meta name="description" content="Open pair trading positions and unrealized P&L" />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-2">
	<ul class="space-y-3" aria-label="Open positions">
		{#each DUMMY_POSITIONS as position (position.id)}
			<PositionListItem {position} />
		{/each}
	</ul>
</div>
