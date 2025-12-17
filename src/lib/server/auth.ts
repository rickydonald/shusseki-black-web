import { XUSER_JWT_SECRET } from "$env/static/private";
import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import jwt from "jsonwebtoken";

export function xUserProtect(event: RequestEvent) {
    const xUserCookie = event.cookies.get("x_user_auth");
    if (!xUserCookie) {
        return json({
            response: false,
            error: "X-User authentication required",
            errorCode: "unauthorized"
        }, { status: 401 });
    }
    const xUser = jwt.verify(xUserCookie, XUSER_JWT_SECRET)
    if (!xUser) {
        return json({
            response: false,
            error: "Invalid X-User token",
            errorCode: "unauthorized"
        }, { status: 401 });
    }
    return null;
}

/**
 * Middleware to protect API routes - ensures user is authenticated
 * Returns error response if not authenticated, otherwise returns null
 */
export function protect(event: RequestEvent) {
    if (!event.locals.user) {
        return json({
            response: false,
            error: "Authentication required",
            errorCode: "unauthorized"
        }, { status: 401 });
    }
    return null;
}

/**
 * Get authenticated user from locals
 * Throws if user is not authenticated
 */
export function requireAuth(event: RequestEvent) {
    if (!event.locals.user) {
        throw json({
            response: false,
            error: "Authentication required",
            errorCode: "unauthorized"
        }, { status: 401 });
    }
    return event.locals.user;
}
