import { json } from "@sveltejs/kit";
import { Minions } from "$lib/utils/minions";
import { scrapeAttendance } from "$lib/models/erp-scrapper/attendance.js";
import { scrapeStudentProfile } from "$lib/models/erp-scrapper/profile.js";

export async function GET({ locals, fetch }) {
    const decrypted = Minions.decryptSessionCookie(locals.user?.session || "");
    const decryptedJson = JSON.parse(decrypted);
    const sessionCookies = JSON.parse(decrypted).cookies;

    let cookieHeader = sessionCookies
        .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
        .join("; ");

    let scrapper = await scrapeAttendance({ dno: locals.user?.userId || "" }, cookieHeader)
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
        

        scrapper = await scrapeAttendance({ dno: locals.user?.userId || "" }, cookieHeader);
        profileScrapper = await scrapeStudentProfile(cookieHeader);
    }

    return json({
        success: true,
        data: scrapper,
        profileScrapper
    });
}