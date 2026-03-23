// Bindings for Cloudflare Workers. Regenerate with `npm run cf-typegen` after changing wrangler.toml.
interface Env {
	[key: string]: unknown;
}

interface ExecutionContext {
	waitUntil(promise: Promise<unknown>): void;
	passThroughOnException(): void;
}

type IncomingRequestCfProperties = Record<string, unknown>;
