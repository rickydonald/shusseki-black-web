import db from "$lib/db";
import { classTimetables } from "$lib/db/schema/users";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { eq } from "drizzle-orm";
import { protect } from "$lib/server/auth";

export const GET: RequestHandler = async (event) => {
    const authCheck = protect(event);
    if (authCheck) return authCheck;

    const { locals } = event;
    try {
        const userId = locals.user?.userId ?? "";
        const classCode = userId.substring(0, 8);

        if (!classCode) {
            return json({
                response: false,
                error: "Invalid class code",
                errorCode: "invalid_class_code"
            }, { status: 400 });
        }

        const timetable = await db
            .select()
            .from(classTimetables)
            .where(eq(classTimetables.classCode, classCode))
            .limit(1);

        if (!timetable || timetable.length === 0) {
            return json({
                response: false,
                error: "No timetable found",
                errorCode: "not_found"
            }, { status: 404 });
        }

        return json({
            response: true,
            data: {
                user_id: timetable[0].userId,
                class_code: timetable[0].classCode,
                timetable: timetable[0].timetable,
                isActive: timetable[0].isActive,
                updatedAt: timetable[0].updatedAt,
                updatedBy: timetable[0].userId
            }
        });
    } catch (error) {
        console.error("Error fetching timetable:", error);
        return json({
            response: false,
            error: "Failed to fetch timetable",
            errorCode: "server_error"
        }, { status: 500 });
    }
};
