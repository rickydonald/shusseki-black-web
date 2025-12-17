import { JWT_SECRET } from "$env/static/private";
import { Constants } from "$lib/constants";
import { isMaintenanceMode } from "$lib/server/helpers-server";
import { redis } from "$lib/server/redis";
import type { User } from "$lib/types/session.type";
import { redirect, type Handle } from "@sveltejs/kit";
import jwt from "jsonwebtoken";

// Beta testers allowed on beta.shusseki.co.in
const BETA_TESTERS = ["25-PCS-018"];

export const handle: Handle = async ({ event, resolve }) => {
    const bypassDomain = event.url.hostname === "beta.shusseki.co.in";

    /** Beta Access Check - Only for beta.shusseki.co.in */
    if (bypassDomain && import.meta.env.PROD) {
        const path = event.url.pathname;

        // Allow login page, root, and API routes without authentication
        const isPublicRoute = path === "/" || path === "/login" || path.startsWith("/login");
        const isApiRoute = path.startsWith("/api/");

        if (!isPublicRoute && !isApiRoute) {
            const authToken = event.cookies.get(Constants._COOKIES.SESSION_COOKIE_NAME);
            let userAllowed = false;

            if (authToken) {
                try {
                    const decode = jwt.verify(authToken, JWT_SECRET) as User;
                    if (decode?.userId && BETA_TESTERS.includes(decode.userId)) {
                        userAllowed = true;
                    }
                } catch (err) {
                    // Invalid token, not allowed
                }
            }

            // If not a beta tester, show message to redirect to main site
            if (!userAllowed) {
                return new Response(
                    `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Beta Access - Shusseki</title>
                    <style>
                        body {
                            margin: 0;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                        }
                        .container {
                            text-align: center;
                            padding: 2rem;
                            background: white;
                            border-radius: 1rem;
                            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                            max-width: 500px;
                            margin: 1rem;
                        }
                        h1 {
                            font-size: 2rem;
                            margin-bottom: 1rem;
                            color: #1a202c;
                        }
                        p {
                            color: #4a5568;
                            line-height: 1.6;
                            margin-bottom: 2rem;
                        }
                        a {
                            display: inline-block;
                            padding: 0.75rem 2rem;
                            background: #3B82F6;
                            color: white;
                            text-decoration: none;
                            border-radius: 0.5rem;
                            font-weight: 600;
                            transition: transform 0.2s, background 0.2s;
                        }
                        a:hover {
                            background: #5a67d8;
                            transform: translateY(-2px);
                        }
                        .beta-badge {
                            display: inline-block;
                            padding: 0.25rem 0.75rem;
                            background: #fbbf24;
                            color: #78350f;
                            font-size: 0.75rem;
                            font-weight: bold;
                            border-radius: 9999px;
                            margin-bottom: 1rem;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="beta-badge">BETA SITE</div>
                        <h1>🔐 Beta Access Required</h1>
                        <p>This is a beta testing site. Please visit the main Shusseki.co.in site to access your attendance and features.</p>
                    </div>
                </body>
                </html>`,
                    {
                        status: 403,
                        headers: {
                            "Content-Type": "text/html; charset=utf-8",
                        },
                    }
                );
            }
        }
    }

    /** Maintenance Mode Check */
    if (import.meta.env.PROD) {
        if (!bypassDomain) {
            const maintenance = await isMaintenanceMode();
            const path = event.url.pathname;

            // Allow access to admin panel and its routes during maintenance
            const isAdminRoute = path.startsWith("/x-user") || path.startsWith("/api/x-user");

            if (maintenance && path !== "/maintenance" && !isAdminRoute) {
                throw redirect(307, "/maintenance");
            }
            if (!maintenance && path === "/maintenance") {
                throw redirect(307, "/");
            }
        }
    }

    /** Verify JWT */
    try {
        const authToken = event.cookies.get(Constants._COOKIES.SESSION_COOKIE_NAME);
        if (authToken) {
            const decode = jwt.verify(authToken, JWT_SECRET) as User
            event.locals.user = decode;
            const isRapidBan = await redis.get(`user:${decode.userId}:banned`);
            if (isRapidBan) {
                event.locals.user = null;
                throw redirect(303, '/api/v1/user/logout');
            }
            if (!decode) {
                console.error("Invalid JWT:", authToken);
            }
        } else {
            console.error("No JWT found");
        }
    } catch (err) {
        console.error("Error verifying JWT:", err);
    }

    // Add getSession helper
    event.locals.getSession = async () => {
        if (event.locals.user) {
            return { user: event.locals.user };
        }
        return null;
    };

    return await resolve(event);
}