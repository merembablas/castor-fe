// Bindings for Cloudflare Workers. Regenerate with `bun run cf-typegen` after changing wrangler.toml.
interface Env {
	PACIFICA_API_BASE_URL?: string;
	PACIFICA_API_AUTHORIZATION?: string;
	PUBLIC_SIGNALS_API_URL?: string;
	PUBLIC_NEWS_API_URL?: string;
	PUBLIC_ARCHIVES_API_URL?: string;
	PAIRS_API_BASE_URL?: string;
	[key: string]: unknown;
}

interface ExecutionContext {
	waitUntil(promise: Promise<unknown>): void;
	passThroughOnException(): void;
}

type IncomingRequestCfProperties = Record<string, unknown>;
