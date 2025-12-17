/**
 * GET /api/x-user/users
 * Get all users with pagination and filtering
 */

import { json } from '@sveltejs/kit';
import db from '$lib/db';
import { users } from '$lib/db/schema/users';
import { desc, like, or, eq, sql, count } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { xUserProtect } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
    const authCheck = xUserProtect(event)
    if (authCheck) return authCheck

	try {
		const page = parseInt(event.url.searchParams.get('page') || '1');
		const limit = parseInt(event.url.searchParams.get('limit') || '20');
		const search = event.url.searchParams.get('search') || '';
		const filterBanned = event.url.searchParams.get('banned'); // 'true', 'false', or null (all)
		const filterShift = event.url.searchParams.get('shift'); // '0', '1', '2', or null (all)
		const offset = (page - 1) * limit;

		// Build where conditions
		let whereConditions = [];
		
		if (search) {
			whereConditions.push(
				or(
					like(users.userId, `%${search}%`),
					like(users.name, `%${search}%`)
				)
			);
		}

		if (filterBanned === 'true') {
			whereConditions.push(eq(users.isBanned, true));
		} else if (filterBanned === 'false') {
			whereConditions.push(eq(users.isBanned, false));
		}

		if (filterShift !== null && filterShift !== undefined && filterShift !== '') {
			const shiftValue = parseInt(filterShift);
			if ([0, 1, 2].includes(shiftValue)) {
				whereConditions.push(eq(users.shift, shiftValue));
			}
		}

		// Get total count
		const [{ total }] = await db
			.select({ total: count() })
			.from(users)
			.where(whereConditions.length > 0 ? sql`${sql.join(whereConditions, sql` AND `)}` : undefined);

		// Get paginated users
		const usersList = await db
			.select({
				id: users.id,
				userId: users.userId,
				name: users.name,
				shift: users.shift,
				isBanned: users.isBanned,
				userType: users.userType,
				createdAt: users.createdAt,
				lastLogin: users.lastLogin,
			})
			.from(users)
			.where(whereConditions.length > 0 ? sql`${sql.join(whereConditions, sql` AND `)}` : undefined)
			.orderBy(desc(users.createdAt))
			.limit(limit)
			.offset(offset);

		return json({
			success: true,
			data: {
				users: usersList,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			},
		});
	} catch (error: any) {
		console.error('[X-User Users API] Error:', error);
		return json(
			{ error: 'Failed to fetch users', details: error.message },
			{ status: 500 }
		);
	}
};
