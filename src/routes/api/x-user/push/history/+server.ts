/**
 * GET /api/x-user/push/history
 * Get push notification history (admin only)
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { xUserProtect } from '$lib/server/auth';
import { desc } from 'drizzle-orm';

export const GET: RequestHandler = async (event) => {
	const xUserAuthCheck = xUserProtect(event);
	if (xUserAuthCheck) return xUserAuthCheck;

	try {
		const { default: db } = await import('$lib/db');
		const { pushNotificationHistory } = await import('$lib/db/schema/users');

		// Get limit from query params (default 50, max 200)
		const url = new URL(event.request.url);
		const limitParam = url.searchParams.get('limit');
		const limit = Math.min(parseInt(limitParam || '50'), 200);

		const history = await db
			.select()
			.from(pushNotificationHistory)
			.orderBy(desc(pushNotificationHistory.createdAt))
			.limit(limit);

		return json({
			success: true,
			history,
			count: history.length,
		});
	} catch (error: any) {
		console.error('[Push History] Error:', error);
		return json(
			{ error: 'Failed to get notification history', details: error.message },
			{ status: 500 }
		);
	}
};
