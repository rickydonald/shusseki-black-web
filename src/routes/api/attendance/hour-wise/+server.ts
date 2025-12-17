import { json } from "@sveltejs/kit";
import { getCachedCookies } from "$lib/server/erp.session";
import * as cheerio from "cheerio";
import { Minions } from "$lib/utils/minions";
import { Scrapper } from "$lib/models/attendance-scrapper.js";
import { Constants } from "$lib/constants.js";

const URL =
    "https://erp.loyolacollege.edu/loyolaonline/students/report/studentHourWiseAttendance.jsp";

export async function GET({ cookies }) {
    const cachedCookies = cookies.get(Constants._COOKIES.ERP_SESSION_COOKIE_NAME);

    if (!cachedCookies) {
        return json(
            { success: false, error: "Not logged in" },
            { status: 401 }
        );
    }

    const decrypted = Minions.decryptSessionCookie(cachedCookies);
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

    const response = await Scrapper.getAttendanceData({
        dno: "w",
        dob: "2020-01-01"
    }, html);

    return json({
        success: true,
        data: response
    });
}