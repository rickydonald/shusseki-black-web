/**
 * POST /api/v1/push/test
 * Send a test notification to the current user
 */

import { json } from '@sveltejs/kit';
import { sendPushToUser } from '$lib/push/server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
	const session = await locals.getSession?.();
	
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const notification = {
			title: '🧪 Test Notification',
			body: 'This is a test notification from Shusseki',
			icon: '/icons/icon-192x192.png',
			badge: '/icons/icon-pwa-96x96.png',
			data: {
				url: '/view/attendance',
				timestamp: Date.now(),
			},
		};

		const result = await sendPushToUser(session.user.userId, notification);

		if (result.sent === 0) {
			return json(
				{
					success: false,
					message: 'No active subscriptions found. Please enable notifications first.',
				},
				{ status: 404 }
			);
		}

		return json({
			success: true,
			...result,
			message: `Test notification sent to ${result.sent} device(s)`,
		});
	} catch (error: any) {
		console.error('[Push Test] Error:', error);
		return json(
			{ error: 'Failed to send test notification', details: error.message },
			{ status: 500 }
		);
	}
};
