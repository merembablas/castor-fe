import { browser } from '$app/environment';
import {
	ACTIVE_PAIR_POSITIONS_STORAGE_KEY,
	readActivePairPositions
} from '$lib/signal/active-pair-positions.js';

function readSlugSet(): Set<string> {
	const out = new Set<string>();
	for (const e of readActivePairPositions()) {
		const s = e.slug.trim();
		if (s) out.add(s);
	}
	return out;
}

class ActivePairSlugsTracker {
	activeSlugs = $state<Set<string>>(new Set());
	/** False until the first client read (avoids SSR/localStorage). */
	hydrated = $state(false);

	constructor() {
		if (!browser) return;
		this.refresh();
		window.addEventListener('storage', this.onStorage);
		window.addEventListener('focus', this.onFocus);
		document.addEventListener('visibilitychange', this.onVisibility);
	}

	refresh = (): void => {
		if (!browser) return;
		this.activeSlugs = readSlugSet();
		this.hydrated = true;
	};

	private onStorage = (e: StorageEvent): void => {
		if (e.key === ACTIVE_PAIR_POSITIONS_STORAGE_KEY || e.key === null) {
			this.refresh();
		}
	};

	private onFocus = (): void => {
		this.refresh();
	};

	private onVisibility = (): void => {
		if (document.visibilityState === 'visible') this.refresh();
	};
}

export const activePairSlugs = new ActivePairSlugsTracker();
