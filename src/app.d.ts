import '../worker-configuration';
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		// interface Error {}
		interface Locals {
			/** Pacifica REST origin for trading, account, orders, prices, market-info (no trailing slash) */
			pacificaApiBaseUrl: string;
			/** Pacifica REST origin for kline/history only; equals pacificaApiBaseUrl when PACIFICA_MARKET_DATA_API_BASE_URL is unset */
			pacificaMarketDataApiBaseUrl: string;
			/** Optional Bearer token or raw Authorization header value for Pacifica REST */
			pacificaApiAuthorization: string;
		}
		// interface PageData {}
		// interface PageState {}
	}
}

export {};
