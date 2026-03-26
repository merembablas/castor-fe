/**
 * borsh (via @solana/web3.js) depends on `text-encoding-utf-8`, whose published
 * tarball can lack usable `exports` for Vite. Alias resolves here; runtime uses
 * built-in TextEncoder / TextDecoder (browser and modern Node).
 */
const TextEncoderImpl = globalThis.TextEncoder;
const TextDecoderImpl = globalThis.TextDecoder;

export { TextEncoderImpl as TextEncoder, TextDecoderImpl as TextDecoder };

export default {
	TextEncoder: TextEncoderImpl,
	TextDecoder: TextDecoderImpl,
};
