import db from "$lib/db";
import { classTimetables } from "$lib/db/schema/users";
import { eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
    const userId = locals.user?.creds.departmentNumber ?? "";
    const classCode = userId.substring(0, 8);

    // Get the current timetable
    const currentTimetable = await db.select().from(classTimetables).where(
        eq(classTimetables.classCode, classCode)
    )

    if (currentTimetable.length === 0) {
        // Redirect to create if no timetable exists
        return {
            redirect: "/view/add-timetable"
        }
    }

    return {
        userId,
        classCode,
        currentTimetable: currentTimetable[0]
    };
};
