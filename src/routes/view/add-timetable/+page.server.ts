import db from "$lib/db";
import { classTimetables } from "$lib/db/schema/users";
import { eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
    const userId = locals.user?.userId ?? "";
    const classCode = userId.substring(0, 8);

    const isExists = await db.select().from(classTimetables).where(
        eq(classTimetables.classCode, classCode)
    )

    if (isExists.length > 0) {
        return {
            classCode,
            timetableData: isExists
        }
    }

    return {
        classCode,
        timetableData: null
    };
};
