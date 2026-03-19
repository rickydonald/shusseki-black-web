import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import type { ErpSession } from "$lib/types/session.type";
import { erpLogin } from "$lib/models/erp-scrapper/login";
import { Wap7 } from "$lib/utils/wap7";
import { Constants } from "$lib/constants";
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from "$env/static/private";

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
    const { username, password } = await request.json();

    if (!username || !password) {
        return json({
            response: false,
            error: "Username and Password are required fields.",
            errorCode: "missing_parameters"
        }, { status: 200 });
    }

    const login = await erpLogin({ username, password });
    if (!login.success) {
        return json({
            response: false,
            error: login.erpError || "Login failed due to unknown error.",
            errorCode: "login_failed"
        }, { status: 200 })
    }

    // The ERP Session object
    const erpSession: ErpSession = {
        creds: {
            username,
            password
        },
        cookies: login.cookies ?? ""
    }
    const encryptedSessionCookie = Wap7.encryptSessionCookie(JSON.stringify(erpSession));

    const userSession = locals.user;
    if (!userSession) {
        return json({
            response: false,
            error: "User session not found after login.",
            errorCode: "user_session_missing"
        }, { status: 401 });
    }

    // Session cookie for Shusseki
    const sessionCookie = jwt.sign({
        ...locals.user,
        session: encryptedSessionCookie,
        issuedAt: Date.now(),
    }, JWT_SECRET);

    cookies.delete(Constants._COOKIES.SESSION_COOKIE_NAME, { path: '/' });
    cookies.set(Constants._COOKIES.SESSION_COOKIE_NAME, sessionCookie, {
        path: "/",
        httpOnly: true,
        secure: import.meta.env.PROD ? true : false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
    });

    locals.user = {
        ...userSession,
        session: encryptedSessionCookie
    };
    locals.erpSession = encryptedSessionCookie;

    return json({
        response: true,
        message: "New session created successfully."
    })
}