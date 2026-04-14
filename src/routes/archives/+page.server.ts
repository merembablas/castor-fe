import { env } from '$env/dynamic/public';
import { fetchArchivesList } from '$lib/archived-signals/fetch-archives.server.js';
import type { ArchivedSignal } from '$lib/archived-signals/archived-signal.js';
import {
	paginateArchivedSignals,
	parseArchivesPageParam,
	sortArchivedSignalsByEndedDesc
} from '$lib/archived-signals/archives-pagination.js';
import { mapArchivesApiRows } from '$lib/archived-signals/map-archives-api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const urlConfigured = env.PUBLIC_ARCHIVES_API_URL?.trim();
	if (!urlConfigured) {
		return {
			archivedSignals: [] as ArchivedSignal[],
			archivesError:
				'Set PUBLIC_ARCHIVES_API_URL to your archives API (full URL including /archives).',
			archivesConfigured: false,
			archivesEmpty: false,
			archivesPageIndex: 1,
			archivesTotalPages: 0,
			archivesShowPagination: false
		};
	}

	const result = await fetchArchivesList(urlConfigured);
	if (!result.ok) {
		return {
			archivedSignals: [] as ArchivedSignal[],
			archivesError: result.error,
			archivesConfigured: true,
			archivesEmpty: false,
			archivesPageIndex: 1,
			archivesTotalPages: 0,
			archivesShowPagination: false
		};
	}

	const mapped = mapArchivesApiRows(result.body.data);
	const sorted = sortArchivedSignalsByEndedDesc(mapped);
	const requestedPage = parseArchivesPageParam(url.searchParams);
	const { pageSignals, pageIndex, totalPages } = paginateArchivedSignals(sorted, requestedPage);

	return {
		archivedSignals: pageSignals,
		archivesError: null as string | null,
		archivesConfigured: true,
		archivesEmpty: sorted.length === 0,
		archivesPageIndex: pageIndex,
		archivesTotalPages: totalPages,
		archivesShowPagination: totalPages > 1
	};
};
