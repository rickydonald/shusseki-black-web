/**
 * POST /api/v1/push/unsubscribe
 * Unsubscribe a device from push notifications
 */

import { json } from '@sveltejs/kit';
import db from '$lib/db';
import { pushSubscriptions } from '$lib/db/schema/users';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.getSession?.();
	
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { deviceId } = body;

		if (!deviceId) {
			return json({ error: 'Missing deviceId' }, { status: 400 });
		}

		const userId = session.user.userId;

		// Delete subscription
		await db
			.delete(pushSubscriptions)
			.where(
				and(
					eq(pushSubscriptions.userId, userId),
					eq(pushSubscriptions.deviceId, deviceId)
				)
			);

		return json({
			success: true,
			message: 'Unsubscribed successfully',
		});
	} catch (error: any) {
		console.error('[Push Unsubscribe] Error:', error);
		return json(
			{ error: 'Failed to unsubscribe', details: error.message },
			{ status: 500 }
		);
	}
};
