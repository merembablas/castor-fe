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
			/** Pacifica REST origin without trailing slash, e.g. https://api.pacifica.fi */
			pacificaApiBaseUrl: string;
			/** Optional Bearer token or raw Authorization header value for Pacifica REST */
			pacificaApiAuthorization: string;
		}
		// interface PageData {}
		// interface PageState {}
	}
}

export {};
