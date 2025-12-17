/**
 * POST /api/x-user/push/send
 * Send push notifications to users (admin only)
 */

import { json } from '@sveltejs/kit';
import { sendPushToUser, sendPushToUsers, broadcastPush } from '$lib/push/server';
import { rateLimit } from '$lib/server/rate-limiter';
import type { RequestHandler } from './$types';
import { xUserProtect } from '$lib/server/auth';

export const POST: RequestHandler = async (event) => {

	// Check if user is admin
	const xUserAuthCheck = xUserProtect(event);
	if (xUserAuthCheck) return xUserAuthCheck;

	// Get admin user ID from cookie for logging
	const xUserAuth = event.cookies.get('x_user_auth');
	let sentBy: string | undefined;
	if (xUserAuth) {
		try {
			const jwt = await import('jsonwebtoken');
			const { XUSER_JWT_SECRET } = await import('$env/static/private');
			const decoded = jwt.default.verify(xUserAuth, XUSER_JWT_SECRET) as { username: string };
			sentBy = decoded.username;
		} catch (error) {
			// Ignore if can't decode
		}
	}

	// Rate limiting: 10 requests per minute
	// const rateLimitResult = await rateLimit({
	// 	key: `push-send:${xUserAuthCheck}`,
	// 	limit: 10,
	// 	window: 60,
	// });

	// if (!rateLimitResult.success) {
	// 	return json(
	// 		{ 
	// 			error: 'Rate limit exceeded',
	// 			message: 'Too many requests. Please try again later.',
	// 		},
	// 		{ status: 429 }
	// 	);
	// }

	try {
		const body = await event.request.json();
		const { targetType, userIds, notification } = body;

		if (!targetType || !notification) {
			return json(
				{ error: 'Missing targetType or notification' },
				{ status: 400 }
			);
		}

		if (!notification.title || !notification.body) {
			return json(
				{ error: 'Notification must have title and body' },
				{ status: 400 }
			);
		}

		// Set default icon and badge if not provided or empty
		if (!notification.icon || notification.icon.trim() === '') {
			notification.icon = '/icons/icon-192x192.png';
		}
		// For Android, badge should be monochrome and smaller
		// Using a smaller icon size that works better as a badge
		if (!notification.badge || notification.badge.trim() === '') {
			notification.badge = '/icons/icon-pwa-96x96.png';
		}

		let result: { sent: number; failed: number };

		switch (targetType) {
			case 'single':
				if (!userIds || userIds.length === 0) {
					return json({ error: 'userIds required for single target' }, { status: 400 });
				}
				result = await sendPushToUser(userIds[0], notification, sentBy);
				break;

			case 'multiple':
				if (!userIds || userIds.length === 0) {
					return json({ error: 'userIds required for multiple target' }, { status: 400 });
				}
				result = await sendPushToUsers(userIds, notification, sentBy);
				break;

			case 'broadcast':
				result = await broadcastPush(notification, sentBy);
				break;

			default:
				return json(
					{ error: 'Invalid targetType. Must be: single, multiple, or broadcast' },
					{ status: 400 }
				);
		}

		return json({
			success: true,
			...result,
			message: `Sent ${result.sent} notification(s), ${result.failed} failed`,
		});
	} catch (error: any) {
		console.error('[Push Send] Error:', error);
		return json(
			{ error: 'Failed to send notification', details: error.message },
			{ status: 500 }
		);
	}
};
