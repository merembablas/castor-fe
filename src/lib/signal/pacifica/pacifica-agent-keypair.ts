/**
 * Pacifica API agent wallet key material (Solana-compatible Ed25519 keypair).
 * Browser-only consumers should import from client modules only.
 */
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

export function generateAgentKeypair(): Keypair {
	return Keypair.generate();
}

export function agentSecretKeyToBase58(secretKey: Uint8Array): string {
	return bs58.encode(secretKey);
}

export function agentKeypairFromSecretBase58(secretBase58: string): Keypair {
	const raw = bs58.decode(secretBase58);
	return Keypair.fromSecretKey(raw);
}
