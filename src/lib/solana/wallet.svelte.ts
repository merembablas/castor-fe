import { env } from '$env/dynamic/public';
import type { Connection, PublicKey } from '@solana/web3.js';
import type { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

const DEFAULT_RPC = 'https://api.devnet.solana.com';

function getSolanaRpcUrl(): string {
	return env.PUBLIC_SOLANA_RPC_URL?.trim() || DEFAULT_RPC;
}

/** Structural typing avoids a runtime import from @solana/web3.js here. */
export function shortenPublicKey(key: { toBase58(): string } | null): string {
	if (!key) return '';
	const s = key.toBase58();
	if (s.length <= 8) return s;
	return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

export class SolanaWalletController {
	connection = $state<Connection | undefined>(undefined);
	adapter = $state<PhantomWalletAdapter | undefined>(undefined);

	publicKey = $state<PublicKey | null>(null);
	connected = $state(false);
	connecting = $state(false);
	/** Mirrors `WalletReadyState` string values from the adapter (no runtime enum import). */
	readyState = $state<string>('Unsupported');
	connectError = $state<string | null>(null);
	/** True after client bootstrap has attached the adapter. */
	initialized = $state(false);

	/** Pacifica API agent wallet bound and ready to sign trades (after connect + bind). */
	pacificaAgentReady = $state(false);
	pacificaAgentError = $state<string | null>(null);
	pacificaAgentBinding = $state(false);

	private initPromise: Promise<void> | null = null;
	private pacificaAgentSetupInFlight: Promise<void> | null = null;

	ensureInit(): void {
		if (this.initPromise) return;
		this.initPromise = import('./wallet-bootstrap.js')
			.then(({ attachPhantomWallet }) => {
				attachPhantomWallet(this, getSolanaRpcUrl());
			})
			.catch((e) => {
				this.connectError = e instanceof Error ? e.message : 'Wallet failed to load';
				this.initialized = true;
			});
	}

	private async awaitInit(): Promise<void> {
		this.ensureInit();
		await this.initPromise;
	}

	walletNotAvailable = $derived(
		this.readyState === 'NotDetected' || this.readyState === 'Unsupported'
	);

	async connect(): Promise<void> {
		await this.awaitInit();
		const a = this.adapter;
		if (!a) return;

		this.connectError = null;

		if (this.walletNotAvailable) {
			this.connectError =
				'Phantom wallet not found. Install the Phantom extension or open this app in a supported browser.';
			return;
		}

		this.connecting = true;
		try {
			await a.connect();
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Could not connect wallet';
			this.connectError = msg;
		} finally {
			this.connecting = false;
		}
	}

	async disconnect(): Promise<void> {
		this.connectError = null;
		this.pacificaAgentReady = false;
		this.pacificaAgentError = null;
		this.pacificaAgentBinding = false;
		if (this.initPromise) await this.initPromise;
		try {
			await this.adapter?.disconnect();
		} catch {
			/* ignore */
		}
	}

	/** Run after wallet connects (or on load if already connected). Binds Pacifica agent if needed. */
	async runPacificaAgentSetup(): Promise<void> {
		await this.awaitInit();
		if (this.pacificaAgentSetupInFlight) return this.pacificaAgentSetupInFlight;
		this.pacificaAgentSetupInFlight = this.runPacificaAgentSetupBody().finally(() => {
			this.pacificaAgentSetupInFlight = null;
		});
		return this.pacificaAgentSetupInFlight;
	}

	private async runPacificaAgentSetupBody(): Promise<void> {
		const a = this.adapter;
		const pk = this.publicKey;
		if (!a || !pk || typeof a.signMessage !== 'function') {
			this.pacificaAgentReady = false;
			this.pacificaAgentError = null;
			this.pacificaAgentBinding = false;
			return;
		}
		this.pacificaAgentBinding = true;
		try {
			const { ensurePacificaAgentBound } =
				await import('$lib/signal/pacifica/pacifica-ensure-agent-client.js');
			await ensurePacificaAgentBound(pk.toBase58(), a);
			this.pacificaAgentReady = true;
			this.pacificaAgentError = null;
		} catch (e) {
			this.pacificaAgentReady = false;
			this.pacificaAgentError =
				e instanceof Error ? e.message : 'Could not set up Pacifica API agent wallet';
		} finally {
			this.pacificaAgentBinding = false;
		}
	}
}

export const solanaWallet = new SolanaWalletController();
