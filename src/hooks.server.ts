import { env } from '$env/dynamic/private';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const platformEnv = (event.platform as { env?: Record<string, string | undefined> } | undefined)
		?.env;
	event.locals.pacificaApiBaseUrl =
		platformEnv?.PACIFICA_API_BASE_URL ?? env.PACIFICA_API_BASE_URL ?? 'https://api.pacifica.fi';

	const marketDataOverride = (
		platformEnv?.PACIFICA_MARKET_DATA_API_BASE_URL ??
		env.PACIFICA_MARKET_DATA_API_BASE_URL ??
		''
	).trim();
	event.locals.pacificaMarketDataApiBaseUrl =
		marketDataOverride || event.locals.pacificaApiBaseUrl;

	event.locals.pacificaApiAuthorization =
		platformEnv?.PACIFICA_API_AUTHORIZATION ?? env.PACIFICA_API_AUTHORIZATION ?? '';
	return resolve(event);
};
