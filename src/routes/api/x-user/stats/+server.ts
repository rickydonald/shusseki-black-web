/**
 * GET /api/x-user/stats
 * Get admin dashboard statistics
 */

import { json } from '@sveltejs/kit';
import db from '$lib/db';
import { users, pushSubscriptions } from '$lib/db/schema/users';
import { count, eq, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { xUserProtect } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
    const authCheck = xUserProtect(event)
    if (authCheck) return authCheck

    try {
        // Total users
        const [{ totalUsers }] = await db
            .select({ totalUsers: count() })
            .from(users);

        // Active users (not banned)
        const [{ activeUsers }] = await db
            .select({ activeUsers: count() })
            .from(users)
            .where(eq(users.isBanned, false));

        // Banned users
        const [{ bannedUsers }] = await db
            .select({ bannedUsers: count() })
            .from(users)
            .where(eq(users.isBanned, true));

        // Push subscriptions
        const [{ totalPushSubscriptions }] = await db
            .select({ totalPushSubscriptions: count() })
            .from(pushSubscriptions);

        // Unique push users
        const uniquePushUsers = await db
            .selectDistinct({ userId: pushSubscriptions.userId })
            .from(pushSubscriptions);

        // Users by shift
        const usersByShift = await db
            .select({
                shift: users.shift,
                count: count(),
            })
            .from(users)
            .groupBy(users.shift);

        return json({
            success: true,
            stats: {
                totalUsers,
                activeUsers,
                bannedUsers,
                totalPushSubscriptions,
                uniquePushUsers: uniquePushUsers.length,
                usersByShift: usersByShift.reduce((acc, item) => {
                    acc[`shift${item.shift}`] = item.count;
                    return acc;
                }, {} as Record<string, number>),
            },
        });
    } catch (error: any) {
        console.error('[X-User Stats API] Error:', error);
        return json(
            { error: 'Failed to fetch stats', details: error.message },
            { status: 500 }
        );
    }
};
