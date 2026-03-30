import { env } from '$env/dynamic/public';
import { fetchArchivesList } from '$lib/archived-signals/fetch-archives.server.js';
import type { ArchivedSignal } from '$lib/archived-signals/archived-signal.js';
import { mapArchivesApiRows } from '$lib/archived-signals/map-archives-api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const url = env.PUBLIC_ARCHIVES_API_URL?.trim();
	if (!url) {
		return {
			archivedSignals: [] as ArchivedSignal[],
			archivesError:
				'Set PUBLIC_ARCHIVES_API_URL to your archives API (full URL including /archives).',
			archivesConfigured: false,
			archivesEmpty: false
		};
	}

	const result = await fetchArchivesList(url);
	if (!result.ok) {
		return {
			archivedSignals: [] as ArchivedSignal[],
			archivesError: result.error,
			archivesConfigured: true,
			archivesEmpty: false
		};
	}

	const archivedSignals = mapArchivesApiRows(result.body.data);
	return {
		archivedSignals,
		archivesError: null as string | null,
		archivesConfigured: true,
		archivesEmpty: archivedSignals.length === 0
	};
};
