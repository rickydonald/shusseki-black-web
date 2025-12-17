/**
 * GET /api/x-user/push/stats
 * Get push notification statistics (admin only)
 */

import { json } from '@sveltejs/kit';
import { getPushStats } from '$lib/push/server';
import type { RequestHandler } from './$types';
import { xUserProtect } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
	const session = await event.locals.getSession?.();

	const xUserAuthCheck = xUserProtect(event);
	if (xUserAuthCheck) return xUserAuthCheck;

	try {
		const stats = await getPushStats();

		return json({
			success: true,
			stats,
		});
	} catch (error: any) {
		console.error('[Push Stats] Error:', error);
		return json(
			{ error: 'Failed to get statistics', details: error.message },
			{ status: 500 }
		);
	}
};
