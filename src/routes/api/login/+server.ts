import { json } from "@sveltejs/kit";
import { erpLoginWithPlaywright } from "$lib/server/erp.login.playwright";
import { getCachedCookies, setCachedCookies } from "$lib/server/erp.session";
import { Minions } from "$lib/utils/minions";
import { Constants } from "$lib/constants.js";

export async function POST({ cookies, request }) {
    const { username, password } = await request.json();

    if (!username || !password) {
        return json(
            { success: false, error: "Username and password are required" },
            { status: 400 }
        );
    }

    const login = await erpLoginWithPlaywright({ username, password });
    if (!login.success) {
        return json(
            { success: false, error: login.erpError || "Login failed" },
            { status: 401 }
        );
    }
    const session = {
        creds: {
            username,
            password
        },
        cookies: login.cookies
    }
    const encryptedSessionCookie = Minions.encryptSessionCookie(JSON.stringify(session));
    cookies.set(Constants._COOKIES.ERP_SESSION_COOKIE_NAME, encryptedSessionCookie, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: import.meta.env.PROD,
    });
    return json({ success: true });
}