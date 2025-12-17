/**
 * POST /api/v1/push/cleanup
 * Clean up old subscriptions for current user (keep only current device)
 */

import { json } from '@sveltejs/kit';
import db from '$lib/db';
import { pushSubscriptions } from '$lib/db/schema/users';
import { eq, and, ne } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.getSession?.();
	
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { deviceId, keepCurrentOnly } = body;

		if (!deviceId) {
			return json({ error: 'Missing deviceId' }, { status: 400 });
		}

		const userId = session.user.userId;

		if (keepCurrentOnly) {
			// Remove all subscriptions for this user except current device
			const result = await db
				.delete(pushSubscriptions)
				.where(
					and(
						eq(pushSubscriptions.userId, userId),
						ne(pushSubscriptions.deviceId, deviceId)
					)
				);

			return json({
				success: true,
				message: 'Old subscriptions cleaned up',
			});
		} else {
			// Just return current subscription count
			const subscriptions = await db
				.select()
				.from(pushSubscriptions)
				.where(eq(pushSubscriptions.userId, userId));

			return json({
				success: true,
				count: subscriptions.length,
				devices: subscriptions.map(s => ({
					deviceId: s.deviceId,
					createdAt: s.createdAt,
				})),
			});
		}
	} catch (error: any) {
		console.error('[Push Cleanup] Error:', error);
		return json(
			{ error: 'Failed to cleanup subscriptions', details: error.message },
			{ status: 500 }
		);
	}
};
