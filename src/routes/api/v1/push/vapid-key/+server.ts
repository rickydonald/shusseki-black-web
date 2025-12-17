/**
 * GET /api/v1/push/vapid-key
 * Returns the VAPID public key for push subscriptions
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PUBLIC_VAPID_PUBLIC_KEY } from '$env/static/public';

export const GET: RequestHandler = async () => {
	const publicKey = PUBLIC_VAPID_PUBLIC_KEY;

	if (!publicKey) {
		return json(
			{ error: 'VAPID public key not configured' },
			{ status: 500 }
		);
	}

	return json({ publicKey });
};
