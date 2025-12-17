/**
 * POST /api/x-user/users/[userId]/ban
 * Ban or unban a user
 */

import { json } from '@sveltejs/kit';
import db from '$lib/db';
import { users } from '$lib/db/schema/users';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { xUserProtect } from '$lib/server/auth';
import { redis } from '$lib/server/redis';

export const POST: RequestHandler = async (event) => {
    const authCheck = xUserProtect(event)
    if (authCheck) return authCheck

    try {
        const { userId } = event.params;
        const { banned } = await event.request.json();

        if (typeof banned !== 'boolean') {
            return json({ error: 'Invalid banned status' }, { status: 400 });
        }

        // Update user ban status
        await db
            .update(users)
            .set({ isBanned: banned })
            .where(eq(users.userId, userId));

        if (!banned) {
            await redis.del(`user:${userId}:banned`);
        } else {
            await redis.set(`user:${userId}:banned`, 'true');
        }

        return json({
            success: true,
            message: `User ${banned ? 'banned' : 'unbanned'} successfully`,
        });
    } catch (error: any) {
        console.error('[X-User Ban API] Error:', error);
        return json(
            { error: 'Failed to update user status', details: error.message },
            { status: 500 }
        );
    }
};
