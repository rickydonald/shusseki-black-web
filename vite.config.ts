import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit'

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), SvelteKitPWA({
		srcDir: './src',
		mode: 'production',
		scope: '/',
		base: '/',
		filename: 'service-worker.ts',
		strategies: 'injectManifest',
		injectRegister: 'auto',
		registerType: 'prompt',
		injectManifest: {
			globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
			injectionPoint: undefined,
		},
		devOptions: {
			enabled: true,
			type: 'module',
			navigateFallback: '/',
		},
		manifest: {
			name: 'Shusseki',
			short_name: 'Shusseki',
			description: 'View and see insights on your attendance records. Track your academic attendance for Loyola students.',
			theme_color: '#000000',
			background_color: '#ffffff',
			display: 'standalone',
			display_override: ['standalone', 'fullscreen'],
			orientation: 'portrait',
			start_url: '/login',
			categories: ['education', 'productivity'],
			lang: 'en',
			dir: 'ltr',
			icons: [
				{
					src: '/icons/icon-48x48.png',
					sizes: '48x48',
					type: 'image/png',
					purpose: 'any'
				},
				{
					src: '/icons/icon-72x72.png',
					sizes: '72x72',
					type: 'image/png',
					purpose: 'any'
				},
				{
					src: '/icons/icon-96x96.png',
					sizes: '96x96',
					type: 'image/png',
					purpose: 'any'
				},
				{
					src: '/icons/icon-144x144.png',
					sizes: '144x144',
					type: 'image/png',
					purpose: 'any'
				},
				{
					src: '/icons/icon-192x192.png',
					sizes: '192x192',
					type: 'image/png',
					purpose: 'any'
				},
				{
					src: '/icons/icon-512x512.png',
					sizes: '512x512',
					type: 'image/png',
					purpose: 'any'
				},
				{
					src: '/icons/icon-192x192.png',
					sizes: '192x192',
					type: 'image/png',
					purpose: 'maskable'
				},
				{
					src: '/icons/icon-512x512.png',
					sizes: '512x512',
					type: 'image/png',
					purpose: 'maskable'
				}
			],
			shortcuts: [
				{
					name: 'View Attendance',
					short_name: 'Attendance',
					description: 'View your attendance records',
					url: '/view/attendance',
					icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }]
				},
				{
					name: 'Add Timetable',
					short_name: 'Timetable',
					description: 'Add your class timetable',
					url: '/view/add-timetable',
					icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }]
				}
			],
			screenshots: [
				{
					src: '/splash_screens/iPhone_16__iPhone_15_Pro__iPhone_15__iPhone_14_Pro_portrait.png',
					sizes: '1179x2556',
					type: 'image/png',
					form_factor: 'narrow'
				},
				{
					src: '/splash_screens/12.9__iPad_Pro_portrait.png',
					sizes: '2048x2732',
					type: 'image/png',
					form_factor: 'wide'
				}
			]
		}
	})],
});
