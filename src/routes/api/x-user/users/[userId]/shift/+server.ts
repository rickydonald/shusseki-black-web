/**
 * POST /api/x-user/users/[userId]/shift
 * Update a user's shift
 */

import { json } from '@sveltejs/kit';
import db from '$lib/db';
import { users } from '$lib/db/schema/users';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { xUserProtect } from '$lib/server/auth';

export const POST: RequestHandler = async (event) => {
    const authCheck = xUserProtect(event)
    if (authCheck) return authCheck

    try {
        const { userId } = event.params;
        const { shift } = await event.request.json();

        if (typeof shift !== 'number' || ![0, 1, 2].includes(shift)) {
            return json({ error: 'Invalid shift value. Must be 0, 1, or 2' }, { status: 400 });
        }

        // Update user shift
        await db
            .update(users)
            .set({ shift })
            .where(eq(users.userId, userId));

        return json({
            success: true,
            message: `User shift updated successfully to ${shift === 0 ? 'Not Set' : `Shift ${shift}`}`,
        });
    } catch (error: any) {
        console.error('[X-User Shift API] Error:', error);
        return json(
            { error: 'Failed to update user shift', details: error.message },
            { status: 500 }
        );
    }
};
