import db from "$lib/db";
import { classTimetables } from "$lib/db/schema/users";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { DateTime } from "luxon";
import { protect } from "$lib/server/auth";
import { eq } from "drizzle-orm";

export const POST: RequestHandler = async (event) => {
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

    const userId = locals.user?.creds.departmentNumber ?? "";
    const classCode = userId.substring(0, 8);
    const now = DateTime.now().toUTC().toISO();

    // Check if timetable exists for this class
    const existing = await db.select().from(classTimetables).where(eq(classTimetables.classCode, classCode))

    if (existing.length > 0) {
        // Update existing timetable - any user from the class can update
        const update = await db.update(classTimetables)
            .set({
                userId, // Track who made the last update
                timetable: body.timetable,
                isActive: true,
                updatedAt: now
            })
            .where(eq(classTimetables.classCode, classCode));

        if (!update) {
            return json({
                response: false,
                error: "Unable to update timetable",
                errorCode: "update_failed"
            });
        }

        return json({
            response: true,
            message: "Timetable updated successfully",
            data: {
                classCode,
                updatedAt: now,
                updatedBy: userId
            }
        });
    } else {
        // Create new timetable
        const create = await db.insert(classTimetables).values({
            userId,
            classCode,
            timetable: body.timetable,
            isActive: true,
            updatedAt: now
        });

        if (!create) {
            return json({
                response: false,
                error: "Unable to create timetable",
                errorCode: "create_failed"
            });
        }

        return json({
            response: true,
            message: "Timetable created successfully",
            data: {
                classCode,
                createdAt: now
            }
        });
    }
}