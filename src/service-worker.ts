/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope & typeof globalThis;

// Vite PWA will inject the precache manifest here
declare let self: ServiceWorkerGlobalScope;

// Cache names
const CACHE_VERSION = 'v1';
const API_CACHE = `api-cache-${CACHE_VERSION}`;
const STATIC_CACHE = `static-cache-${CACHE_VERSION}`;
const IMAGE_CACHE = `image-cache-${CACHE_VERSION}`;

// Install event - cache essential resources
sw.addEventListener('install', (event: ExtendableEvent) => {
	console.log('[Service Worker] Installing...');
	// Don't skip waiting - let the user control when to update
	// sw.skipWaiting();
});

// Activate event - clean up old caches
sw.addEventListener('activate', (event: ExtendableEvent) => {
	console.log('[Service Worker] Activating...');
	
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (
						!cacheName.includes(CACHE_VERSION) &&
						(cacheName.startsWith('api-cache-') ||
							cacheName.startsWith('static-cache-') ||
							cacheName.startsWith('image-cache-'))
					) {
						console.log('[Service Worker] Deleting old cache:', cacheName);
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
	// Don't claim clients immediately to avoid reload loops
	// Let clients reload naturally
});

// Fetch event - handle caching strategies
sw.addEventListener('fetch', (event: FetchEvent) => {
	const { request } = event;
	const url = new URL(request.url);

	// Skip non-GET requests
	if (request.method !== 'GET') {
		return;
	}

	// Skip chrome-extension and other non-http(s) requests
	if (!url.protocol.startsWith('http')) {
		return;
	}

	// Skip requests to different origins
	if (url.origin !== location.origin) {
		return;
	}

	// API requests - Network First strategy
	if (url.pathname.startsWith('/api/')) {
		event.respondWith(
			fetch(request)
				.then((response) => {
					if (response.status === 200) {
						const responseToCache = response.clone();
						caches.open(API_CACHE).then((cache) => {
							cache.put(request, responseToCache);
							cleanupCache(API_CACHE, 50);
						});
					}
					return response;
				})
				.catch(() => {
					return caches.match(request).then((cachedResponse) => {
						if (cachedResponse) {
							return cachedResponse;
						}
						return new Response('Network error', {
							status: 503,
							statusText: 'Service Unavailable',
						});
					});
				})
		);
		return;
	}

	// Static assets - Cache First strategy
	if (
		request.destination === 'style' ||
		request.destination === 'script' ||
		request.destination === 'worker' ||
		request.destination === 'font'
	) {
		event.respondWith(
			caches.match(request).then((cachedResponse) => {
				if (cachedResponse) {
					return cachedResponse;
				}
				return fetch(request).then((response) => {
					if (response.status === 200) {
						const responseToCache = response.clone();
						caches.open(STATIC_CACHE).then((cache) => {
							cache.put(request, responseToCache);
							cleanupCache(STATIC_CACHE, 100);
						});
					}
					return response;
				});
			})
		);
		return;
	}

	// Images - Cache First strategy
	if (request.destination === 'image') {
		event.respondWith(
			caches.match(request).then((cachedResponse) => {
				if (cachedResponse) {
					return cachedResponse;
				}
				return fetch(request).then((response) => {
					if (response.status === 200) {
						const responseToCache = response.clone();
						caches.open(IMAGE_CACHE).then((cache) => {
							cache.put(request, responseToCache);
							cleanupCache(IMAGE_CACHE, 60);
						});
					}
					return response;
				});
			})
		);
		return;
	}
});

// Helper function to clean up cache entries
async function cleanupCache(cacheName: string, maxEntries: number) {
	const cache = await caches.open(cacheName);
	const keys = await cache.keys();
	
	if (keys.length > maxEntries) {
		const entriesToDelete = keys.length - maxEntries;
		for (let i = 0; i < entriesToDelete; i++) {
			await cache.delete(keys[i]);
		}
	}
}

/**
 * Push Notification Handling
 */

// Handle push notification received
sw.addEventListener('push', (event: PushEvent) => {
	console.log('[Service Worker] Push event received:', event);

	if (!event.data) {
		console.log('[Service Worker] Push event has no data');
		return;
	}

	try {
		const data = event.data.json();
		console.log('[Service Worker] Push data parsed:', data);

		const {
			title = 'Shusseki',
			body = 'You have a new notification',
			icon = '/icons/icon-192x192.png',
			badge = '/icons/icon-pwa-96x96.png',
			image,
			tag = 'shusseki-notification',
			data: notificationData = {},
			actions = [],
			requireInteraction = false,
			silent = false,
		} = data;

		const notificationOptions: NotificationOptions = {
			body,
			icon,
			badge,
			tag,
			data: notificationData,
			requireInteraction,
			silent,
		};

		console.log('[Service Worker] Showing notification:', title, notificationOptions);

		// Show notification
		event.waitUntil(
			sw.registration.showNotification(title, notificationOptions).then(() => {
				console.log('[Service Worker] Notification shown successfully');
			}).catch((error) => {
				console.error('[Service Worker] Error showing notification:', error);
			})
		);

		// Notify all clients that a push was received
		event.waitUntil(
			sw.clients.matchAll({ type: 'window' }).then((clients) => {
				clients.forEach((client) => {
					client.postMessage({
						type: 'PUSH_RECEIVED',
						notification: data,
					});
				});
			})
		);
	} catch (error) {
		console.error('[Service Worker] Error handling push:', error);
	}
});

// Handle notification click
sw.addEventListener('notificationclick', (event: NotificationEvent) => {
	console.log('[Service Worker] Notification clicked:', event);

	event.notification.close();

	const { action } = event;
	const notificationData = event.notification.data || {};
	const url = notificationData.url || '/view/attendance';

	if (action === 'close') {
		return;
	}

	// Open or focus window
	event.waitUntil(
		sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
			// Check if there's already a window open
			for (const client of clients) {
				if (client.url === url && 'focus' in client) {
					return client.focus();
				}
			}

			// Open new window
			if (sw.clients.openWindow) {
				return sw.clients.openWindow(url);
			}
		})
	);
});

// Handle notification close
sw.addEventListener('notificationclose', (event: NotificationEvent) => {
	console.log('[Service Worker] Notification closed:', event);
});

// Handle push subscription change
sw.addEventListener('pushsubscriptionchange', (event: any) => {
	console.log('[Service Worker] Push subscription changed');

	event.waitUntil(
		sw.registration.pushManager
			.subscribe({
				userVisibleOnly: true,
				applicationServerKey: event.oldSubscription?.options.applicationServerKey,
			})
			.then((subscription) => {
				console.log('[Service Worker] Subscribed after subscription change:', subscription);

				// Update subscription on server
				return fetch('/api/v1/push/subscribe', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						subscription: subscription.toJSON(),
						deviceId: localStorage.getItem('push_device_id'),
					}),
				});
			})
			.catch((error) => {
				console.error('[Service Worker] Error re-subscribing:', error);
			})
	);
});

// Handle messages from clients
sw.addEventListener('message', (event: ExtendableMessageEvent) => {
	console.log('[Service Worker] Message received:', event.data);

	if (event.data?.type === 'SKIP_WAITING') {
		console.log('[Service Worker] Skipping waiting and taking control');
		sw.skipWaiting().then(() => {
			// After skipping waiting, claim clients
			return sw.clients.claim();
		});
	}
});

console.log('[Service Worker] Service Worker loaded with push notification support');
