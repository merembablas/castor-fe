import { env as publicEnv } from '$env/dynamic/public';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const pacificaWsUrl = publicEnv.PUBLIC_PACIFICA_WS_URL?.trim() || 'wss://ws.pacifica.fi/ws';
	return { pacificaWsUrl };
};
