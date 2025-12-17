import { json } from "@sveltejs/kit";
import { Minions } from "$lib/utils/minions";
import { Scrapper } from "$lib/models/attendance-scrapper.js";
import { Constants } from "$lib/constants.js";
import { scrapeAttendance } from "$lib/models/erp-scrapper/attendance.js";
import { scrapeStudentProfile } from "$lib/models/erp-scrapper/profile.js";

const URL = "https://erp.loyolacollege.edu/loyolaonline/students/report/studentHourWiseAttendance.jsp";

export async function GET({ locals }) {
    const decrypted = Minions.decryptSessionCookie(locals.user?.session || "");
    const sessionCookies = JSON.parse(decrypted).cookies;

    const cookieHeader = sessionCookies
        .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
        .join("; ");

    const res = await fetch(URL, {
        headers: {
            Cookie: cookieHeader
        }
    });

    const html = await res.text();
    const scrapper = await scrapeAttendance({ dno: locals.user?.userId || "" }, html)
    const profileScrapper = await scrapeStudentProfile(cookieHeader);

    return json({
        success: true,
        data: scrapper,
        profileScrapper
    });
}