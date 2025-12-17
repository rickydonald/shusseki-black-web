/**
 * Client-side Push Notification Manager
 * Handles subscription, permission requests, and user interactions
 */

import { browser } from '$app/environment';

const DEVICE_ID_KEY = 'push_device_id';
const PERMISSION_ASKED_KEY = 'push_permission_asked';
const CURRENT_USER_KEY = 'push_current_user';
const USER_DEVICE_MAP_KEY = 'push_user_device_map';

/**
 * Get stored user-device mappings
 */
function getUserDeviceMap(): Record<string, string> {
	if (!browser) return {};
	try {
		const stored = localStorage.getItem(USER_DEVICE_MAP_KEY);
		return stored ? JSON.parse(stored) : {};
	} catch {
		return {};
	}
}

/**
 * Save user-device mappings
 */
function saveUserDeviceMap(map: Record<string, string>): void {
	if (!browser) return;
	localStorage.setItem(USER_DEVICE_MAP_KEY, JSON.stringify(map));
}

/**
 * Generate or retrieve device ID for current user
 * Creates a unique device ID per user to handle multiple users on same device
 */
export function getDeviceId(userId?: string): string {
	if (!browser) return '';
	
	// If no userId provided, try to get from current user
	if (!userId) {
		userId = localStorage.getItem(CURRENT_USER_KEY) || undefined;
	}
	
	// Get the user-device mapping
	const userDeviceMap = getUserDeviceMap();
	
	// If we have a userId, get or create user-specific device ID
	if (userId) {
		let deviceId = userDeviceMap[userId];
		if (!deviceId) {
			deviceId = `device-${userId.substring(0, 8)}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
			userDeviceMap[userId] = deviceId;
			saveUserDeviceMap(userDeviceMap);
		}
		return deviceId;
	}
	
	// Fallback: get or create generic device ID (for backwards compatibility)
	let deviceId = localStorage.getItem(DEVICE_ID_KEY);
	if (!deviceId) {
		deviceId = `browser-${Date.now()}-${Math.random().toString(36).substring(7)}`;
		localStorage.setItem(DEVICE_ID_KEY, deviceId);
	}
	return deviceId;
}

/**
 * Handle user login - set current user and re-sync subscriptions
 */
export async function onUserLogin(userId: string): Promise<void> {
	if (!browser) return;
	
	const previousUser = localStorage.getItem(CURRENT_USER_KEY);
	localStorage.setItem(CURRENT_USER_KEY, userId);
	
	// If different user is logging in, re-sync subscription
	if (previousUser && previousUser !== userId) {
		console.log('[Push] User switched, re-syncing subscriptions');
		
		// Check if new user already has subscription for this device
		const permission = getPermissionStatus();
		if (permission === 'granted') {
			try {
				await syncUserSubscription(userId);
			} catch (error) {
				console.error('[Push] Error syncing subscription on user switch:', error);
			}
		}
	}
}

/**
 * Handle user logout - clear user-specific state
 */
export function onUserLogout(): void {
	if (!browser) return;
	localStorage.removeItem(CURRENT_USER_KEY);
	console.log('[Push] User logged out, cleared current user');
}

/**
 * Sync subscription for current user
 */
async function syncUserSubscription(userId: string): Promise<void> {
	if (!isPushSupported()) return;
	
	try {
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.getSubscription();
		
		if (subscription) {
			// Re-send subscription to server for this user
			const deviceId = getDeviceId(userId);
			const response = await fetch('/api/v1/push/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					subscription: subscription.toJSON(),
					deviceId,
				}),
			});
			
			if (response.ok) {
				console.log('[Push] Subscription synced for user:', userId);
			}
		}
	} catch (error) {
		console.error('[Push] Error syncing subscription:', error);
	}
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
	return browser && 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Get current notification permission status
 */
export function getPermissionStatus(): NotificationPermission {
	if (!browser || !('Notification' in window)) return 'default';
	return Notification.permission;
}

/**
 * Check if user was already asked for permission
 */
export function wasPermissionAsked(): boolean {
	if (!browser) return false;
	return localStorage.getItem(PERMISSION_ASKED_KEY) === 'true';
}

/**
 * Mark that permission was asked
 */
export function markPermissionAsked(): void {
	if (!browser) return;
	localStorage.setItem(PERMISSION_ASKED_KEY, 'true');
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
	if (!isPushSupported()) {
		throw new Error('Push notifications are not supported');
	}

	markPermissionAsked();
	
	try {
		const permission = await Notification.requestPermission();
		return permission;
	} catch (error) {
		console.error('[Push] Error requesting permission:', error);
		throw error;
	}
}

/**
 * Get VAPID public key from server
 */
async function getVapidPublicKey(): Promise<string> {
	try {
		const response = await fetch('/api/v1/push/vapid-key');
		if (!response.ok) {
			throw new Error('Failed to fetch VAPID key');
		}
		const data = await response.json();
		return data.publicKey;
	} catch (error) {
		console.error('[Push] Error fetching VAPID key:', error);
		throw error;
	}
}

/**
 * Convert base64 VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
	const rawData = atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<PushSubscription> {
	if (!isPushSupported()) {
		throw new Error('Push notifications are not supported');
	}

	try {
		// Wait for service worker to be ready
		const registration = await navigator.serviceWorker.ready;
		
		// Check if already subscribed
		let subscription = await registration.pushManager.getSubscription();
		
		if (subscription) {
			console.log('[Push] Already subscribed');
			return subscription;
		}

		// Get VAPID public key
		const vapidPublicKey = await getVapidPublicKey();
		const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

		// Subscribe
		subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: applicationServerKey as any
		});

		console.log('[Push] Subscribed successfully');

		// Send subscription to server
		const currentUser = localStorage.getItem(CURRENT_USER_KEY);
		const deviceId = getDeviceId(currentUser || undefined);
		const response = await fetch('/api/v1/push/subscribe', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				subscription: subscription.toJSON(),
				deviceId,
			}),
		});

		if (!response.ok) {
			throw new Error('Failed to save subscription on server');
		}

		// Store subscription date if not already stored
		if (!localStorage.getItem('push_subscription_date')) {
			localStorage.setItem('push_subscription_date', new Date().toISOString());
		}

		return subscription;
	} catch (error) {
		console.error('[Push] Error subscribing:', error);
		throw error;
	}
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
	if (!isPushSupported()) {
		return false;
	}

	try {
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.getSubscription();

		if (!subscription) {
			console.log('[Push] No subscription found');
			return true;
		}

		// Unsubscribe from browser
		const unsubscribed = await subscription.unsubscribe();

		if (unsubscribed) {
			// Remove from server
			const currentUser = localStorage.getItem(CURRENT_USER_KEY);
			const deviceId = getDeviceId(currentUser || undefined);
			await fetch('/api/v1/push/unsubscribe', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ deviceId }),
			});

			console.log('[Push] Unsubscribed successfully');
		}

		return unsubscribed;
	} catch (error) {
		console.error('[Push] Error unsubscribing:', error);
		return false;
	}
}

/**
 * Check if currently subscribed to push
 */
export async function isPushSubscribed(): Promise<boolean> {
	if (!isPushSupported()) {
		return false;
	}

	try {
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.getSubscription();
		return subscription !== null;
	} catch (error) {
		console.error('[Push] Error checking subscription:', error);
		return false;
	}
}

/**
 * Initialize push notifications with permission request
 * Call this when user logs in or app initializes
 */
export async function initPushNotifications(): Promise<boolean> {
	if (!isPushSupported()) {
		console.log('[Push] Push notifications not supported');
		return false;
	}

	const permission = getPermissionStatus();

	// If already granted, subscribe
	if (permission === 'granted') {
		try {
			await subscribeToPush();
			return true;
		} catch (error) {
			console.error('[Push] Error auto-subscribing:', error);
			return false;
		}
	}

	// If denied, don't ask again
	if (permission === 'denied') {
		console.log('[Push] Notifications blocked by user');
		return false;
	}

	// If default and not asked before, we'll let the UI handle it
	// Don't auto-request permission on page load (bad UX)
	return false;
}

/**
 * Enable push notifications (request permission and subscribe)
 * Call this from a user interaction (button click)
 */
export async function enablePushNotifications(): Promise<{
	success: boolean;
	permission?: NotificationPermission;
	error?: string;
}> {
	if (!isPushSupported()) {
		return {
			success: false,
			error: 'Push notifications are not supported on this device',
		};
	}

	try {
		// Request permission
		const permission = await requestNotificationPermission();

		if (permission === 'granted') {
			// Subscribe to push
			await subscribeToPush();
			return { success: true, permission };
		} else {
			return {
				success: false,
				permission,
				error: 'Notification permission was denied',
			};
		}
	} catch (error: any) {
		console.error('[Push] Error enabling notifications:', error);
		return {
			success: false,
			error: error.message || 'Failed to enable notifications',
		};
	}
}

/**
 * Listen for push subscription changes and lifecycle events
 */
export function listenForPushLifecycle(
	onSubscribed?: () => void,
	onUnsubscribed?: () => void
): void {
	if (!browser || !isPushSupported()) return;

	// Listen for messages from service worker
	navigator.serviceWorker.addEventListener('message', (event) => {
		const { type } = event.data;

		switch (type) {
			case 'PUSH_SUBSCRIPTION_CHANGED':
				console.log('[Push] Subscription changed');
				onSubscribed?.();
				break;
			case 'PUSH_UNSUBSCRIBED':
				console.log('[Push] Unsubscribed');
				onUnsubscribed?.();
				break;
			case 'PUSH_RECEIVED':
				console.log('[Push] Push notification received:', event.data.notification);
				break;
		}
	});
}

/**
 * Get user's device subscriptions
 */
export async function getUserDevices(): Promise<{
	success: boolean;
	count?: number;
	devices?: Array<{ deviceId: string; createdAt: string }>;
	error?: string;
}> {
	try {
		const currentUser = localStorage.getItem(CURRENT_USER_KEY);
		const deviceId = getDeviceId(currentUser || undefined);
		
		const response = await fetch('/api/v1/push/cleanup', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ deviceId, keepCurrentOnly: false }),
		});

		if (!response.ok) {
			throw new Error('Failed to fetch devices');
		}

		return await response.json();
	} catch (error: any) {
		return {
			success: false,
			error: error.message || 'Failed to fetch devices',
		};
	}
}

/**
 * Clean up old device subscriptions (keep only current device)
 */
export async function cleanupOldDevices(): Promise<{
	success: boolean;
	error?: string;
}> {
	try {
		const currentUser = localStorage.getItem(CURRENT_USER_KEY);
		const deviceId = getDeviceId(currentUser || undefined);
		
		const response = await fetch('/api/v1/push/cleanup', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ deviceId, keepCurrentOnly: true }),
		});

		if (!response.ok) {
			throw new Error('Failed to cleanup devices');
		}

		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error.message || 'Failed to cleanup devices',
		};
	}
}
