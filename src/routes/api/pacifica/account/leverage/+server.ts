import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function normalizeBase(baseUrl: string): string {
	return baseUrl.replace(/\/+$/, '');
}

/** Proxy signed POST to Pacifica `POST /api/v1/account/leverage`. */
export const POST: RequestHandler = async ({ request, locals }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ success: false as const, error: 'Invalid JSON body' }, { status: 400 });
	}

	const auth = locals.pacificaApiAuthorization?.trim();
	const url = new URL('/api/v1/account/leverage', `${normalizeBase(locals.pacificaApiBaseUrl)}/`);

	const headers = new Headers({
		Accept: 'application/json',
		'Content-Type': 'application/json'
	});
	if (auth) headers.set('Authorization', auth);

	try {
		const res = await fetch(url.toString(), {
			method: 'POST',
			headers,
			body: JSON.stringify(body)
		});
		const text = await res.text();
		let parsed: unknown = null;
		try {
			parsed = text ? JSON.parse(text) : null;
		} catch {
			parsed = { raw: text };
		}
		if (!res.ok) {
			const err =
				parsed &&
				typeof parsed === 'object' &&
				'error' in parsed &&
				typeof (parsed as { error: unknown }).error === 'string'
					? (parsed as { error: string }).error
					: `Pacifica leverage HTTP ${res.status}`;
			return json({ success: false as const, error: err, details: parsed }, { status: 502 });
		}
		return json({ success: true as const, data: parsed });
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Leverage request failed';
		return json({ success: false as const, error: message }, { status: 502 });
	}
};
