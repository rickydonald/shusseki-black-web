import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { Scrapper } from "$lib/models/attendance-scrapper";
import { normalizeDno } from "$lib/methods";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "$env/static/private";
import { Constants } from "$lib/constants";
import db from "$lib/db";
import { users } from "$lib/db/schema/users";
import { DateTime } from "luxon";
import { eq } from "drizzle-orm";
import { sha256 } from 'js-sha256'
import { hashSync } from "bcrypt-ts";
import { checkBruteForce, recordFailure, resetFailures } from "$lib/server/rate-limiter";
import type { User } from "$lib/types/session.type";

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
    const formData = await request.formData();
    const departmentNumber = formData.get("departmentNumber") as string;
    const dateOfBirth = formData.get("dateOfBirth") as string;

    const csrfToken = formData.get("_token") as string;
    const csrfTokenCookie = cookies.get(Constants._COOKIES.CSRF_COOKIE_NAME);

    if (csrfToken !== csrfTokenCookie) {
        return json({
            response: false,
            error: "Invalid CSRF token.",
            errorCode: "invalid_csrf_token"
        }, { status: 403 });
    }

    const csrfTokenDecoded = csrfToken ? atob(csrfToken) : null;
    const delimitedCsrfToken = csrfTokenDecoded ? csrfTokenDecoded.split("<>") : [];
    if (delimitedCsrfToken[1].length !== 4 || delimitedCsrfToken[1] !== "mins") {
        return json({
            response: false,
            error: "CSRF token has expired, please refresh the page.",
            errorCode: "expired_csrf_token"
        }, { status: 403 });
    }

    if (!departmentNumber || !dateOfBirth) {
        return new Response(JSON.stringify({
            response: false,
            error: "DNO and DOB are required fields.",
            errorCode: "missing_parameters"
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const dno = normalizeDno(departmentNumber).toUpperCase();
    const dob = dateOfBirth;

    const bruteCheck = await checkBruteForce(dno);
    if (bruteCheck.locked) {
        return new Response(JSON.stringify({
            response: false,
            error: "Too many failed attempts, account temporarily locked.",
            errorCode: "progressive_lockout",
        }), {
            status: 429,
            headers: {
                "Content-Type": "application/json",
            }
        });
    }

    // Fetch from database to see if user exists
    let shussekiUserRecord = await db.select().from(users).where(eq(users.userId, dno)).limit(1);
    if (shussekiUserRecord.length !== 0) {
        if (shussekiUserRecord[0].isBanned) {
            return json({
                response: false,
                error: "This user is banned for time-being.",
                errorCode: "user_banned"
            }, { status: 200 })
        }
    }

    // Fetch attendance data from scrapper
    const res = await Scrapper.getAttendanceData({ dno, dob });
    if (!res.data || !res.status) {
        await recordFailure(dno);
        return json({
            response: false,
            error: "DNO or DOB is incorrect, please try again!",
            errorCode: "attendance_data_not_found"
        }, { status: 200 })
    }

    const currentTimestamp = DateTime.now().toUTC().toISO();

    // Ensure user exists in database else create new user
    if (shussekiUserRecord.length === 0) {
        const dobHashStage1 = sha256(dob);
        const dobHashFinal = hashSync(dobHashStage1, 12);
        await db.insert(users).values({
            userId: dno,
            dobHash: dobHashFinal,
            name: res.data.student.name,
            createdAtServer: currentTimestamp,
        });
        shussekiUserRecord = await db.select().from(users).where(eq(users.userId, dno)).limit(1);
    }

    await resetFailures(dno);

    await db.update(users).set({
        lastLogin: currentTimestamp
    }).where(eq(users.userId, dno));

    const userShift = shussekiUserRecord[0]?.shift ?? 0;

    const sessionId = crypto.randomUUID();
    const userObject: User = {
        sessionId,
        userId: dno,
        creds: {
            departmentNumber: dno,
            dateOfBirth: dob
        },
        role: "user",
        fullName: res.data.student.name,
        shift: userShift,
    }
    const sessionCookie = jwt.sign({
        ...userObject,
        issuedAt: Date.now(),
    }, JWT_SECRET, { expiresIn: '15d' });

    cookies.delete(Constants._COOKIES.CSRF_COOKIE_NAME, { path: '/' });
    cookies.set(Constants._COOKIES.SESSION_COOKIE_NAME, sessionCookie, {
        path: "/",
        httpOnly: true,
        secure: import.meta.env.PROD ? true : false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
    });

    locals.user = userObject;

    return json({
        response: true,
        redirectUrl: "/view/attendance"
    });
}