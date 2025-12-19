import db from "$lib/db";
import { classTimetables } from "$lib/db/schema/users";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { DateTime } from "luxon";
import { eq, and, ne } from "drizzle-orm";
import { protect } from "$lib/server/auth";

export const PUT: RequestHandler = async (event) => {
    const authCheck = protect(event);
    if (authCheck) return authCheck;

    const { request, locals } = event;
    const body = await request.json();
    if (!body || !body.timetable) {
        return json({
            response: false,
            error: "No timetable data provided",
            errorCode: "no_data_provided"
        })
    }

    const userId = locals.user?.userId ?? "";
    const classCode = userId.substring(0, 8);
    const now = DateTime.now().toUTC().toISO();

    try {
        // Check if class timetable exists
        const existing = await db.select().from(classTimetables).where(
            eq(classTimetables.classCode, classCode)
        );

        if (existing.length === 0) {
            return json({
                response: false,
                error: "No timetable found for this class",
                errorCode: "not_found"
            }, { status: 404 });
        }

        // Update the class timetable (shared by all classmates)
        await db.update(classTimetables)
            .set({
                userId, // Track who made the last update
                timetable: body.timetable,
                updatedAt: now
            })
            .where(eq(classTimetables.classCode, classCode));

        return json({
            response: true,
            message: "Timetable updated successfully",
            data: {
                classCode,
                updatedAt: now,
                updatedBy: userId
            }
        });
    } catch (error) {
        console.error("Error updating timetable:", error);
        return json({
            response: false,
            error: "Failed to update timetable",
            errorCode: "database_error"
        }, { status: 500 });
    }
}
