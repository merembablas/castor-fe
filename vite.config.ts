import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const textEncodingShim = fileURLToPath(new URL('./src/shims/text-encoding-utf-8.ts', import.meta.url));

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	resolve: {
		alias: {
			'text-encoding-utf-8': textEncodingShim,
		},
	},
});
