import {
	agentKeypairFromSecretBase58,
	generateAgentKeypair,
	agentSecretKeyToBase58
} from './pacifica-agent-keypair.js';
import {
	postBindAgentWallet,
	type WalletSignMessageAdapter
} from './pacifica-agent-bind-client.js';
import { loadPacificaAgent, savePacificaAgent } from './pacifica-agent-storage.js';

/**
 * Ensures a stored agent key exists and is bound to the main account on Pacifica.
 * Call after wallet connect; uses one main-wallet signature when bind is required.
 */
export async function ensurePacificaAgentBound(
	mainAccountBase58: string,
	adapter: WalletSignMessageAdapter
): Promise<void> {
	let stored = loadPacificaAgent(mainAccountBase58);
	if (!stored) {
		const kp = generateAgentKeypair();
		stored = {
			secretKeyBase58: agentSecretKeyToBase58(kp.secretKey),
			bound: false
		};
		savePacificaAgent(mainAccountBase58, stored);
	}

	if (stored.bound) return;

	const agentKp = agentKeypairFromSecretBase58(stored.secretKeyBase58);
	await postBindAgentWallet({
		adapter,
		account: mainAccountBase58,
		agentWalletPubkeyBase58: agentKp.publicKey.toBase58()
	});

	savePacificaAgent(mainAccountBase58, { ...stored, bound: true });
}
