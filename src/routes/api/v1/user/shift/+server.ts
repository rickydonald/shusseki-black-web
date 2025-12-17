import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { protect } from "$lib/server/auth";
import db from "$lib/db";
import { users } from "$lib/db/schema/users";
import { eq } from "drizzle-orm";

export const GET: RequestHandler = async (event) => {
	const authCheck = protect(event);
	if (authCheck) return authCheck;

	const { locals } = event;
	const userId = locals.user?.userId;

	if (!userId) {
		return json({
			status: false,
			error: "User not authenticated",
			errorCode: "missing_user_id"
		}, { status: 400 });
	}

	try {
		// Get user's shift
		const userRecords = await db
			.select({ shift: users.shift })
			.from(users)
			.where(eq(users.userId, userId))
			.limit(1);

		if (userRecords.length === 0) {
			return json({
				status: false,
				error: "User not found",
				errorCode: "user_not_found"
			}, { status: 404 });
		}

		return json({
			status: true,
			shift: userRecords[0].shift
		});
	} catch (error) {
		console.error("Failed to get shift:", error);
		return json({
			status: false,
			error: "Failed to get shift",
			errorCode: "database_error"
		}, { status: 500 });
	}
};
