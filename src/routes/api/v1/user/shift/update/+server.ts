import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { protect } from "$lib/server/auth";
import db from "$lib/db";
import { users } from "$lib/db/schema/users";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "$env/static/private";
import { Constants } from "$lib/constants";
import { DateTime } from "luxon";
import { rateLimit } from "$lib/server/rate-limiter";

export const POST: RequestHandler = async (event) => {
	const authCheck = protect(event);
	if (authCheck) return authCheck;

	const { locals, cookies } = event;
	const userId = locals.user?.userId;

	if (!userId) {
		return json({
			status: false,
			error: "User not authenticated",
			errorCode: "missing_user_id"
		}, { status: 400 });
	}

	// Rate limit: 5 requests per minute per user
	const rateLimitResult = await rateLimit({
		key: `shift-update:${userId}`,
		limit: 5,
		window: 60,
	});

	if (!rateLimitResult.success) {
		return json({
			status: false,
			error: "Too many requests. Please wait before updating your shift again.",
			errorCode: "rate_limit_exceeded",
			retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
		}, { status: 429 });
	}

	try {
		const { shift } = await event.request.json();

		// Validate shift value
		if (shift !== 1 && shift !== 2) {
			return json({
				status: false,
				error: "Invalid shift value. Must be 1 or 2.",
				errorCode: "invalid_shift"
			}, { status: 400 });
		}

		await db
			.update(users)
			.set({ shift: shift })
			.where(eq(users.userId, userId));

		if (!locals.user) {
			return json({
				status: false,
				error: "User session invalid",
				errorCode: "invalid_session"
			}, { status: 401 });
		}

		const updatedUser = {
			...locals.user,
			shift: shift
		};

		const sessionCookie = jwt.sign(updatedUser, JWT_SECRET);

		cookies.set(Constants._COOKIES.SESSION_COOKIE_NAME, sessionCookie, {
			path: "/",
			httpOnly: true,
			secure: import.meta.env.PROD ? true : false,
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 30
		});

		locals.user.shift = shift;

		return json({
			status: true,
			message: "Shift updated successfully",
			shift
		});
	} catch (error) {
		console.error("Failed to update shift:", error);
		return json({
			status: false,
			error: "Failed to update shift",
			errorCode: "database_error"
		}, { status: 500 });
	}
};
