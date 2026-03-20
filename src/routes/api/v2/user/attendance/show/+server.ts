import { json } from "@sveltejs/kit";
import { Wap7 } from "$lib/utils/wap7";
import { scrapeAttendance } from "$lib/models/erp-scrapper/attendance";
import { scrapeStudentProfile } from "$lib/models/erp-scrapper/profile";
import { Constants } from "$lib/constants";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "$env/static/private";

export async function GET({ locals, fetch }) {
    try {
        if (!locals.user?.session || !locals.user?.userId) {
            return json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const session = JSON.parse(
            Wap7.decryptSessionCookie(locals.user.session)
        );

        let cookieHeader = session.cookies ?? "";
        let reauthenticated = false;

        let profile = await scrapeStudentProfile(cookieHeader, ["name", "deptNo"]);
        let attendance;

        if (!profile?.name) {
            reauthenticated = true;
            const loginRes = await fetch("/api/v2/user/internal-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: locals.user.userId,
                    password: session.creds?.password,
                }),
            });

            if (!loginRes.ok) {
                return json(
                    {
                        success: false,
                        error: "Internal re-login failed",
                    },
                    { status: 500 }
                );
            }

            // Read the freshly issued app session token from Set-Cookie so this same
            const fallbackSession = JSON.parse(
                Wap7.decryptSessionCookie(locals.user.session)
            );
            const setCookieHeader =
                loginRes.headers.get("set-cookie") ??
                (
                    (loginRes.headers as unknown as { getSetCookie?: () => string[] })
                        .getSetCookie?.() ?? []
                ).join(",");
            const tokenMatch = setCookieHeader.match(
                new RegExp(`${Constants._COOKIES.SESSION_COOKIE_NAME}=([^;]+)`)
            );

            if (tokenMatch?.[1]) {
                try {
                    const payload = jwt.verify(tokenMatch[1], JWT_SECRET);
                    const encryptedSession =
                        typeof payload === "object" && payload?.session
                            ? String(payload.session)
                            : "";

                    if (encryptedSession) {
                        const updatedSession = JSON.parse(
                            Wap7.decryptSessionCookie(encryptedSession)
                        );
                        cookieHeader = updatedSession.cookies ?? fallbackSession.cookies ?? "";
                    } else {
                        cookieHeader = fallbackSession.cookies ?? "";
                    }
                } catch {
                    cookieHeader = fallbackSession.cookies ?? "";
                }
            } else {
                cookieHeader = fallbackSession.cookies ?? "";
            }

            profile = await scrapeStudentProfile(cookieHeader, ["name", "deptNo"]);

            if (!profile?.name) {
                return json(
                    {
                        success: false,
                        error: "Profile not available after re-login",
                    },
                    { status: 500 }
                );
            }
        }

        attendance = await scrapeAttendance(
            { dno: locals.user.userId },
            cookieHeader
        );

        return json({
            success: true,
            reauthenticated,
            data: {
                attendance,
                profile
            },
        });

    } catch (err) {
        console.error("ERP attendance API failed:", err);
        return json(
            {
                success: false,
                error: "Unexpected server error",
            },
            { status: 500 }
        );
    }
}