import { Connection, type PublicKey } from '@solana/web3.js';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { WalletDisconnectedError } from '@solana/wallet-adapter-base';
import type { SolanaWalletController } from './wallet.svelte.js';

/**
 * Browser-only: loaded via dynamic import from `SolanaWalletController` so SSR
 * never evaluates @solana/web3.js / borsh.
 */
export function attachPhantomWallet(ctrl: SolanaWalletController, rpcUrl: string): void {
	const connection = new Connection(rpcUrl, 'confirmed');
	const a = new PhantomWalletAdapter();

	const sync = () => {
		ctrl.publicKey = a.publicKey;
		ctrl.connected = a.connected;
		ctrl.readyState = a.readyState;
	};

	a.on('connect', (pk: PublicKey) => {
		ctrl.publicKey = pk;
		ctrl.connected = true;
		ctrl.connecting = false;
		ctrl.connectError = null;
		void ctrl.runPacificaAgentSetup();
	});
	a.on('disconnect', () => {
		ctrl.publicKey = null;
		ctrl.connected = false;
		ctrl.connecting = false;
		ctrl.pacificaAgentReady = false;
		ctrl.pacificaAgentError = null;
		ctrl.pacificaAgentBinding = false;
	});
	a.on('error', (err) => {
		if (err instanceof WalletDisconnectedError) return;
		ctrl.connectError = err?.message ?? 'Wallet error';
		ctrl.connecting = false;
	});
	a.on('readyStateChange', (rs) => {
		ctrl.readyState = rs;
	});

	ctrl.connection = connection;
	ctrl.adapter = a;
	sync();
	ctrl.initialized = true;

	if (a.connected && a.publicKey) {
		void ctrl.runPacificaAgentSetup();
	}
}
