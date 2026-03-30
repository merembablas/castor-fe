export const mainNavLinks = [
	{ path: '/' as const, label: 'Live signals', match: (p: string) => p === '/' },
	{ path: '/positions' as const, label: 'Positions', match: (p: string) => p === '/positions' },
	{ path: '/archives' as const, label: 'Archives', match: (p: string) => p === '/archives' },
	{ path: '/pairs' as const, label: 'Pairs', match: (p: string) => p === '/pairs' }
] as const;

export type MainNavLink = (typeof mainNavLinks)[number];
