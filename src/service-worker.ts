/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { base, build, files, version } from '$service-worker';

const worker = globalThis as unknown as ServiceWorkerGlobalScope;
const CACHE_NAME = `tourist-report-${version}`;
const APP_SHELL = `${base}/`;
const ASSETS = [...new Set([...build, ...files, APP_SHELL])];

worker.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

worker.addEventListener('activate', (event) => {
	async function activate(): Promise<void> {
		const oldCaches = (await caches.keys()).filter((name) => name !== CACHE_NAME);
		await Promise.all(oldCaches.map((name) => caches.delete(name)));
		await worker.clients.claim();
	}

	event.waitUntil(activate());
});

worker.addEventListener('message', (event) => {
	if (event.data?.type === 'SKIP_WAITING') void worker.skipWaiting();
});

worker.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);
	if (url.origin !== worker.location.origin) return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE_NAME);

			if (ASSETS.includes(url.pathname)) {
				const cached = await cache.match(url.pathname);
				if (cached) return cached;
			}

			try {
				const response = await fetch(event.request);
				if (response.ok && !response.headers.get('cache-control')?.includes('no-store')) {
					void cache.put(event.request, response.clone());
				}
				return response;
			} catch (error) {
				const cached = await cache.match(event.request);
				if (cached) return cached;

				if (event.request.mode === 'navigate') {
					const shell = await cache.match(APP_SHELL);
					if (shell) return shell;
				}

				throw error;
			}
		})()
	);
});
