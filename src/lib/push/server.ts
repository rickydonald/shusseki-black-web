/**
 * Server-side Push Notification Manager
 * Handles sending push notifications to users
 * Optimized for handling 100+ users with batch parallel processing
 */

import { VAPID_PRIVATE_KEY } from '$env/static/private';
import { PUBLIC_VAPID_PUBLIC_KEY } from '$env/static/public';
import { eq, inArray } from 'drizzle-orm';
import type { PushSubscription as WebPushSubscription } from 'web-push';

let webpush: any;
let db: any;
let pushSubscriptions: any;
let pushNotificationHistory: any;

// Configuration for batch processing
const BATCH_SIZE = 20; // Process 20 notifications concurrently
const NOTIFICATION_TIMEOUT = 10000; // 10 second timeout per notification

// Dynamic imports to avoid issues during build
async function initDependencies() {
	if (!webpush) {
		webpush = await import('web-push');
		const dbModule = await import('$lib/db');
		db = dbModule.default;
		const schemaModule = await import('$lib/db/schema/users');
		pushSubscriptions = schemaModule.pushSubscriptions;
		pushNotificationHistory = schemaModule.pushNotificationHistory;

		// Configure web-push with VAPID keys
		const publicKey = PUBLIC_VAPID_PUBLIC_KEY
		const privateKey = VAPID_PRIVATE_KEY
		const subject = 'mailto:admin@shusseki.co.in';

		if (publicKey && privateKey) {
			webpush.default.setVapidDetails(subject, publicKey, privateKey);
		} else {
			console.warn('[Push Server] VAPID keys not configured. Push notifications will not work.');
		}
	}
}

export interface PushNotificationPayload {
	title: string;
	body: string;
	icon?: string;
	badge?: string;
	image?: string;
	tag?: string;
	data?: Record<string, any>;
	actions?: Array<{
		action: string;
		title: string;
		icon?: string;
	}>;
	requireInteraction?: boolean;
	silent?: boolean;
}

/**
 * Log notification to history
 */
async function logNotification(
	targetType: 'single' | 'multiple' | 'broadcast',
	payload: PushNotificationPayload,
	result: { sent: number; failed: number },
	userId?: string,
	sentBy?: string
): Promise<void> {
	await initDependencies();

	try {
		const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`;
		
		await db.insert(pushNotificationHistory).values({
			notificationId,
			userId: userId || null,
			targetType,
			title: payload.title,
			body: payload.body,
			icon: payload.icon || null,
			badge: payload.badge || null,
			data: payload.data ? JSON.stringify(payload.data) : null,
			sentCount: result.sent,
			failedCount: result.failed,
			sentBy: sentBy || null,
			createdAt: new Date().toISOString(),
		});

		console.log(`[Push Server] Logged notification ${notificationId}`);
	} catch (error) {
		console.error('[Push Server] Error logging notification:', error);
		// Don't throw - logging shouldn't break the send operation
	}
}

/**
 * Send a push notification to a specific subscription with timeout
 */
async function sendPushNotificationWithTimeout(
	subscription: WebPushSubscription,
	payload: PushNotificationPayload,
	timeoutMs: number = NOTIFICATION_TIMEOUT
): Promise<{ success: boolean; error?: any }> {
	return Promise.race([
		sendPushNotification(subscription, payload)
			.then(() => ({ success: true }))
			.catch((error) => ({ success: false, error })),
		new Promise<{ success: boolean; error: any }>((resolve) =>
			setTimeout(() => resolve({ success: false, error: new Error('Timeout') }), timeoutMs)
		)
	]);
}

/**
 * Send a push notification to a specific subscription
 */
export async function sendPushNotification(
	subscription: WebPushSubscription,
	payload: PushNotificationPayload
): Promise<void> {
	await initDependencies();

	if (!webpush) {
		throw new Error('Web push not initialized');
	}

	try {
		await webpush.default.sendNotification(subscription, JSON.stringify(payload));
		console.log('[Push Server] Notification sent successfully');
	} catch (error: any) {
		console.error('[Push Server] Error sending notification:', error);
		
		// If subscription is expired (410 Gone), we should remove it
		if (error.statusCode === 410) {
			console.log('[Push Server] Subscription expired, should be removed');
		}
		
		throw error;
	}
}

/**
 * Send push notification to a specific user (all their devices)
 * Optimized with batch parallel processing
 */
export async function sendPushToUser(
	userId: string,
	payload: PushNotificationPayload,
	sentBy?: string
): Promise<{ sent: number; failed: number }> {
	await initDependencies();

	try {
		// Get all subscriptions for this user
		const subscriptions = await db
			.select()
			.from(pushSubscriptions)
			.where(eq(pushSubscriptions.userId, userId));

		if (subscriptions.length === 0) {
			console.log(`[Push Server] No subscriptions found for user ${userId}`);
			return { sent: 0, failed: 0 };
		}

		let sent = 0;
		let failed = 0;
		const expiredDeviceIds: string[] = [];

		// Process all devices in parallel (user typically has 1-3 devices)
		const results = await Promise.allSettled(
			subscriptions.map(async (sub: any) => {
				const subscription = {
					endpoint: sub.subscription.endpoint,
					keys: {
						p256dh: sub.subscription.keys.p256dh,
						auth: sub.subscription.keys.auth,
					},
				};

				const result = await sendPushNotificationWithTimeout(subscription as any, payload);
				
				if (!result.success) {
					// Mark for removal if expired
					if (result.error?.statusCode === 410) {
						return { deviceId: sub.deviceId, expired: true, sent: false };
					}
					return { deviceId: sub.deviceId, expired: false, sent: false };
				}
				
				return { deviceId: sub.deviceId, expired: false, sent: true };
			})
		);

		// Process results
		for (const result of results) {
			if (result.status === 'fulfilled') {
				if (result.value.sent) {
					sent++;
				} else {
					failed++;
					if (result.value.expired) {
						expiredDeviceIds.push(result.value.deviceId);
					}
				}
			} else {
				failed++;
			}
		}

		// Clean up expired subscriptions
		if (expiredDeviceIds.length > 0) {
			await db
				.delete(pushSubscriptions)
				.where(inArray(pushSubscriptions.deviceId, expiredDeviceIds));
			console.log(`[Push Server] Removed ${expiredDeviceIds.length} expired subscriptions`);
		}

		const finalResult = { sent, failed };
		console.log(`[Push Server] Sent to user ${userId}: ${sent} sent, ${failed} failed`);
		
		// Log notification
		await logNotification('single', payload, finalResult, userId, sentBy);
		
		return finalResult;
	} catch (error) {
		console.error('[Push Server] Error sending push to user:', error);
		throw error;
	}
}

/**
 * Send push notification to multiple users
 * Optimized with batch parallel processing for 100+ users
 */
export async function sendPushToUsers(
	userIds: string[],
	payload: PushNotificationPayload,
	sentBy?: string
): Promise<{ sent: number; failed: number }> {
	let totalSent = 0;
	let totalFailed = 0;

	console.log(`[Push Server] Sending to ${userIds.length} users in batches of ${BATCH_SIZE}`);

	// Process users in batches
	for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
		const batch = userIds.slice(i, i + BATCH_SIZE);
		const batchNum = Math.floor(i / BATCH_SIZE) + 1;
		const totalBatches = Math.ceil(userIds.length / BATCH_SIZE);
		
		console.log(`[Push Server] Processing batch ${batchNum}/${totalBatches} (${batch.length} users)`);

		// Process batch in parallel
		const results = await Promise.allSettled(
			batch.map(userId => sendPushToUser(userId, payload, sentBy))
		);

		// Aggregate results
		for (const result of results) {
			if (result.status === 'fulfilled') {
				totalSent += result.value.sent;
				totalFailed += result.value.failed;
			} else {
				console.error('[Push Server] Batch user error:', result.reason);
				totalFailed++;
			}
		}

		// Small delay between batches to avoid overwhelming the push service
		if (i + BATCH_SIZE < userIds.length) {
			await new Promise(resolve => setTimeout(resolve, 100));
		}
	}

	const result = { sent: totalSent, failed: totalFailed };
	console.log(`[Push Server] Sent to ${userIds.length} users: ${totalSent} sent, ${totalFailed} failed`);
	
	// Log notification (for multiple users, we don't specify userId)
	await logNotification('multiple', payload, result, undefined, sentBy);

	return result;
}

/**
 * Broadcast push notification to all subscribed users
 * Optimized with chunked database queries and batch parallel processing
 */
export async function broadcastPush(
	payload: PushNotificationPayload,
	sentBy?: string
): Promise<{ sent: number; failed: number }> {
	await initDependencies();

	try {
		// Get all active subscriptions
		const allSubscriptions = await db.select().from(pushSubscriptions);

		if (allSubscriptions.length === 0) {
			console.log('[Push Server] No subscriptions found for broadcast');
			return { sent: 0, failed: 0 };
		}

		console.log(`[Push Server] Broadcasting to ${allSubscriptions.length} subscriptions in batches of ${BATCH_SIZE}`);

		let sent = 0;
		let failed = 0;
		const expiredDeviceIds: string[] = [];

		// Process subscriptions in batches
		for (let i = 0; i < allSubscriptions.length; i += BATCH_SIZE) {
			const batch = allSubscriptions.slice(i, i + BATCH_SIZE);
			const batchNum = Math.floor(i / BATCH_SIZE) + 1;
			const totalBatches = Math.ceil(allSubscriptions.length / BATCH_SIZE);
			
			console.log(`[Push Server] Broadcasting batch ${batchNum}/${totalBatches} (${batch.length} subscriptions)`);

			// Send to batch in parallel
			const results = await Promise.allSettled(
				batch.map(async (sub: any) => {
					const subscription = {
						endpoint: sub.subscription.endpoint,
						keys: {
							p256dh: sub.subscription.keys.p256dh,
							auth: sub.subscription.keys.auth,
						},
					};

					const result = await sendPushNotificationWithTimeout(subscription as any, payload);
					
					if (!result.success) {
						if (result.error?.statusCode === 410) {
							return { deviceId: sub.deviceId, expired: true, sent: false };
						}
						return { deviceId: sub.deviceId, expired: false, sent: false };
					}
					
					return { deviceId: sub.deviceId, expired: false, sent: true };
				})
			);

			// Process batch results
			for (const result of results) {
				if (result.status === 'fulfilled') {
					if (result.value.sent) {
						sent++;
					} else {
						failed++;
						if (result.value.expired) {
							expiredDeviceIds.push(result.value.deviceId);
						}
					}
				} else {
					failed++;
				}
			}

			// Small delay between batches to avoid overwhelming the push service
			if (i + BATCH_SIZE < allSubscriptions.length) {
				await new Promise(resolve => setTimeout(resolve, 100));
			}
		}

		// Clean up expired subscriptions in one query
		if (expiredDeviceIds.length > 0) {
			await db
				.delete(pushSubscriptions)
				.where(inArray(pushSubscriptions.deviceId, expiredDeviceIds));
			console.log(`[Push Server] Removed ${expiredDeviceIds.length} expired subscriptions`);
		}

		const result = { sent, failed };
		console.log(`[Push Server] Broadcast complete: ${sent} sent, ${failed} failed`);
		
		// Log notification
		await logNotification('broadcast', payload, result, undefined, sentBy);
		
		return result;
	} catch (error) {
		console.error('[Push Server] Error broadcasting push:', error);
		throw error;
	}
}

/**
 * Get push notification statistics
 */
export async function getPushStats(): Promise<{
	totalSubscriptions: number;
	uniqueUsers: number;
	subscriptionsByUser: Record<string, number>;
}> {
	await initDependencies();

	try {
		const allSubscriptions = await db.select().from(pushSubscriptions);

		const subscriptionsByUser: Record<string, number> = {};
		for (const sub of allSubscriptions) {
			subscriptionsByUser[sub.userId] = (subscriptionsByUser[sub.userId] || 0) + 1;
		}

		return {
			totalSubscriptions: allSubscriptions.length,
			uniqueUsers: Object.keys(subscriptionsByUser).length,
			subscriptionsByUser,
		};
	} catch (error) {
		console.error('[Push Server] Error getting stats:', error);
		throw error;
	}
}
