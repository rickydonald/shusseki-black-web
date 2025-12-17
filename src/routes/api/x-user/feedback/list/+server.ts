import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import db from "$lib/db";
import { userFeedbacks } from "$lib/db/schema/users";
import { desc, eq } from "drizzle-orm";
import { xUserProtect } from "$lib/server/auth";

export const GET: RequestHandler = async (event) => {
	// Check admin authentication
	const xUserAuthCheck = xUserProtect(event);
	if (xUserAuthCheck) return xUserAuthCheck;

	try {
		const filter = event.url.searchParams.get('filter') || 'all';
		
		// Build query based on filter
		let feedbackList;
		
		if (filter === 'unreplied') {
			feedbackList = await db
				.select()
				.from(userFeedbacks)
				.where(eq(userFeedbacks.isReplied, false))
				.orderBy(desc(userFeedbacks.createdAt));
		} else if (filter === 'replied') {
			feedbackList = await db
				.select()
				.from(userFeedbacks)
				.where(eq(userFeedbacks.isReplied, true))
				.orderBy(desc(userFeedbacks.createdAt));
		} else {
			feedbackList = await db
				.select()
				.from(userFeedbacks)
				.orderBy(desc(userFeedbacks.createdAt));
		}

		// Get statistics
		const allFeedback = await db.select().from(userFeedbacks);
		const stats = {
			total: allFeedback.length,
			unreplied: allFeedback.filter(f => !f.isReplied).length,
			replied: allFeedback.filter(f => f.isReplied).length,
		};

		return json({
			success: true,
			data: feedbackList,
			stats,
		});
	} catch (error) {
		console.error("Fetch feedback error:", error);
		return json({ error: "Failed to fetch feedback" }, { status: 500 });
	}
};
