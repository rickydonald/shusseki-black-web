import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import db from "$lib/db";
import { userFeedbacks } from "$lib/db/schema/users";
import { eq, desc } from "drizzle-orm";
import { protect } from "$lib/server/auth";

export const GET: RequestHandler = async (event) => {
	const authCheck = protect(event);
	if (authCheck) return authCheck;

	const { locals } = event;

	try {
		// Get all feedback for the authenticated user
		const feedbackList = await db
			.select()
			.from(userFeedbacks)
			.where(eq(userFeedbacks.userId, locals.user!.userId))
			.orderBy(desc(userFeedbacks.createdAt));

		return json({
			success: true,
			data: feedbackList,
		});
	} catch (error) {
		console.error("Fetch feedback error:", error);
		return json({ error: "Failed to fetch feedback" }, { status: 500 });
	}
};
