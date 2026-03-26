import { json } from '@sveltejs/kit';
import { fetchPacificaAccount } from '$lib/signal/pacifica/account-fetch.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const account = url.searchParams.get('account')?.trim();
	if (!account) {
		return json({ success: false as const, error: 'Missing account' }, { status: 400 });
	}

	const auth = locals.pacificaApiAuthorization?.trim();

	try {
		const raw = await fetchPacificaAccount({
			baseUrl: locals.pacificaApiBaseUrl,
			account,
			authorization: auth || undefined
		});

		return json({
			success: true as const,
			data: {
				accountEquity: raw.account_equity,
				totalMarginUsed: raw.total_margin_used,
				availableToSpend: raw.available_to_spend,
				availableToWithdraw: raw.available_to_withdraw,
				balance: raw.balance,
				updatedAt: raw.updated_at
			}
		});
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Account fetch failed';
		return json({ success: false as const, error: message }, { status: 502 });
	}
};
