import { json } from '@sveltejs/kit';
import db from '$lib/db';
import { classTimetables } from '$lib/db/schema/users';
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
		const activeOnly = event.url.searchParams.get('active') === 'true';
		const offset = (page - 1) * limit;

		// Build where conditions
		let whereConditions = [];
		
		if (search) {
			whereConditions.push(
				or(
					like(classTimetables.classCode, `%${search}%`),
					like(classTimetables.userId, `%${search}%`)
				)
			);
		}

		if (activeOnly) {
			whereConditions.push(eq(classTimetables.isActive, true));
		}

		// Get total count
		const [{ total }] = await db
			.select({ total: count() })
			.from(classTimetables)
			.where(whereConditions.length > 0 ? sql`${sql.join(whereConditions, sql` AND `)}` : undefined);

		// Get paginated timetables
		const timetablesList = await db
			.select({
				id: classTimetables.id,
				userId: classTimetables.userId,
				classCode: classTimetables.classCode,
				timetable: classTimetables.timetable,
				isActive: classTimetables.isActive,
				createdAt: classTimetables.createdAt,
				updatedAt: classTimetables.updatedAt,
			})
			.from(classTimetables)
			.where(whereConditions.length > 0 ? sql`${sql.join(whereConditions, sql` AND `)}` : undefined)
			.orderBy(desc(classTimetables.updatedAt))
			.limit(limit)
			.offset(offset);

		return json({
			success: true,
			data: {
				timetables: timetablesList,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			},
		});
	} catch (error: any) {
		console.error('[X-User Timetables API] Error:', error);
		return json(
			{ error: 'Failed to fetch timetables', details: error.message },
			{ status: 500 }
		);
	}
};
