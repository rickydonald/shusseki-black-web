import { json } from '@sveltejs/kit';
import db from '$lib/db';
import { classTimetables } from '$lib/db/schema/users';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { xUserProtect } from '$lib/server/auth';
import { DateTime } from 'luxon';

export const POST: RequestHandler = async (event) => {
    const authCheck = xUserProtect(event)
    if (authCheck) return authCheck

    try {
        const { classCode } = event.params;
        const { timetable, isActive } = await event.request.json();

        if (!timetable) {
            return json({ error: 'Timetable data is required' }, { status: 400 });
        }

        const currentTimestamp = DateTime.now().toUTC().toISO();

        // Check if timetable exists
        const existing = await db
            .select()
            .from(classTimetables)
            .where(eq(classTimetables.classCode, classCode))
            .limit(1);

        if (existing.length === 0) {
            return json({ error: 'Timetable not found for this class code' }, { status: 404 });
        }

        // Update timetable
        await db
            .update(classTimetables)
            .set({ 
                timetable,
                isActive: isActive !== undefined ? isActive : true,
                updatedAt: currentTimestamp 
            })
            .where(eq(classTimetables.classCode, classCode));

        return json({
            success: true,
            message: 'Timetable updated successfully',
        });
    } catch (error: any) {
        console.error('[X-User Timetable Update API] Error:', error);
        return json(
            { error: 'Failed to update timetable', details: error.message },
            { status: 500 }
        );
    }
};

export const GET: RequestHandler = async (event) => {
    const authCheck = xUserProtect(event)
    if (authCheck) return authCheck

    try {
        const { classCode } = event.params;

        const timetable = await db
            .select()
            .from(classTimetables)
            .where(eq(classTimetables.classCode, classCode))
            .limit(1);

        if (timetable.length === 0) {
            return json({ error: 'Timetable not found' }, { status: 404 });
        }

        return json({
            success: true,
            data: timetable[0],
        });
    } catch (error: any) {
        console.error('[X-User Timetable Get API] Error:', error);
        return json(
            { error: 'Failed to fetch timetable', details: error.message },
            { status: 500 }
        );
    }
};
