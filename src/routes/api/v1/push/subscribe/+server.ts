/**
 * POST /api/v1/push/subscribe
 * Subscribe a device to push notifications
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
		const { subscription, deviceId } = body;

		if (!subscription || !deviceId) {
			return json(
				{ error: 'Missing subscription or deviceId' },
				{ status: 400 }
			);
		}

		const userId = session.user.userId;
		const now = new Date().toISOString();

		// Check if subscription already exists
		const existing = await db
			.select()
			.from(pushSubscriptions)
			.where(
				and(
					eq(pushSubscriptions.userId, userId),
					eq(pushSubscriptions.deviceId, deviceId)
				)
			)
			.limit(1);

		if (existing.length > 0) {
			// Update existing subscription
			await db
				.update(pushSubscriptions)
				.set({
					subscription: subscription,
					updatedAt: now,
				})
				.where(eq(pushSubscriptions.id, existing[0].id));

			return json({
				success: true,
				message: 'Subscription updated',
			});
		}

		// Insert new subscription
		await db.insert(pushSubscriptions).values({
			userId,
			deviceId,
			subscription: subscription,
			createdAt: now,
			updatedAt: now,
		});

		return json({
			success: true,
			message: 'Subscribed successfully',
		});
	} catch (error: any) {
		console.error('[Push Subscribe] Error:', error);
		return json(
			{ error: 'Failed to subscribe', details: error.message },
			{ status: 500 }
		);
	}
};
