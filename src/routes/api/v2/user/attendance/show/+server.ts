import { json } from "@sveltejs/kit";
import { Minions } from "$lib/utils/minions";
import { Scrapper } from "$lib/models/attendance-scrapper.js";
import { Constants } from "$lib/constants.js";
import { scrapeAttendance } from "$lib/models/erp-scrapper/attendance.js";
import { scrapeStudentProfile } from "$lib/models/erp-scrapper/profile.js";
import { erpLoginWithPlaywright } from "$lib/server/erp.login.playwright.js";

const URL = "https://erp.loyolacollege.edu/loyolaonline/students/report/studentHourWiseAttendance.jsp";

export async function GET({ locals, fetch }) {
    const decrypted = Minions.decryptSessionCookie(locals.user?.session || "");
    const decryptedJson = JSON.parse(decrypted);
    const sessionCookies = JSON.parse(decrypted).cookies;

    let cookieHeader = sessionCookies
        .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
        .join("; ");

    const res = await fetch(URL, {
        headers: {
            Cookie: cookieHeader
        }
    });

    let html = await res.text();
    let scrapper = await scrapeAttendance({ dno: locals.user?.userId || "" }, html)
    let profileScrapper = await scrapeStudentProfile(cookieHeader);

    if (!profileScrapper.name) {
        const login = await fetch('/api/v2/user/internal-login', {
            method: "POST",
            body: JSON.stringify({
                username: locals.user?.userId,
                password: decryptedJson.creds.password
            })
        });
        if (!login.ok) {
            return json({
                success: false,
                error: "Internal re-login failed"
            }, { status: 500 });
        }

        const res = await fetch(URL, {
            headers: {
                Cookie: cookieHeader
            }
        });

        let html = await res.text();
        scrapper = await scrapeAttendance({ dno: locals.user?.userId || "" }, html);
        profileScrapper = await scrapeStudentProfile(cookieHeader);
    }

    return json({
        success: true,
        data: scrapper,
        profileScrapper
    });
}