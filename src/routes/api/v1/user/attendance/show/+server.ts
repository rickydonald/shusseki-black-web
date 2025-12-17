import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { Scrapper } from "$lib/models/attendance-scrapper";
import { userRateLimiter } from "$lib/server/rate-limiter";
import { protect } from "$lib/server/auth";

export const GET: RequestHandler = async (event) => {
    const authCheck = protect(event);
    if (authCheck) return authCheck;

    const { url, locals } = event;
    const username = locals.user?.creds.departmentNumber;
    const dateOfBirth = locals.user?.creds.dateOfBirth;
    if (!username || !dateOfBirth) {
        return json({
            status: false,
            error: "Username and Date of Birth are required",
            errorCode: "missing_data"
        }, { status: 400 });
    }

    /** User Rate Limiter */
    const userCheck = await userRateLimiter.limit(username);
    if (!userCheck.success) {
        return json({
            response: false,
            error: "Too many requests, please slow down",
            errorCode: "user_rate_limited",
        }, { status: 429 });
    }

    try {
        const attendanceScrapperData = await Scrapper.getAttendanceData({
            dno: username,
            dob: dateOfBirth
        })
        return json({
            status: true,
            data: attendanceScrapperData,
        });
    } catch (error) {
        return json({
            status: false,
            error: "Failed to retrieve attendance data",
            errorCode: "data_fetch_error"
        }, { status: 500 });
    }
}