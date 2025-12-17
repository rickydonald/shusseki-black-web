import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import db from "$lib/db";
import { userFeedbacks } from "$lib/db/schema/users";
import { eq } from "drizzle-orm";
import { rateLimit } from "$lib/server/rate-limiter";
import { sendPushToUser } from "$lib/push/server";
import { xUserProtect } from "$lib/server/auth";

export const POST: RequestHandler = async (event) => {
	// Check admin authentication
	const xUserAuthCheck = xUserProtect(event);
	if (xUserAuthCheck) return xUserAuthCheck;

	// Rate limit: 30 requests per minute
	const rateLimitResult = await rateLimit({
		key: 'admin-feedback-reply',
		limit: 30,
		window: 60,
	});

	if (!rateLimitResult.success) {
		return json({
			error: "Too many requests. Please wait before replying again.",
			retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
		}, { status: 429 });
	}

	try {
		const { feedbackId, reply } = await event.request.json();

		if (!feedbackId || !reply) {
			return json({ error: 'Feedback ID and reply are required' }, { status: 400 });
		}

		if (reply.length > 500) {
			return json({ error: 'Reply must be 500 characters or less' }, { status: 400 });
		}

		// Get the feedback to find the userId
		const feedbackRecords = await db
			.select()
			.from(userFeedbacks)
			.where(eq(userFeedbacks.feedbackId, feedbackId))
			.limit(1);

		if (feedbackRecords.length === 0) {
			return json({ error: 'Feedback not found' }, { status: 404 });
		}

		const feedback = feedbackRecords[0];

		// Update feedback with reply
		await db
			.update(userFeedbacks)
			.set({
				reply,
				isReplied: true,
				updatedAt: new Date().toISOString(),
			})
			.where(eq(userFeedbacks.feedbackId, feedbackId));

		// Send push notification to the user
		try {
			await sendPushToUser(feedback.userId, {
				title: '💬 Feedback Reply Received',
				body: `Your feedback "${feedback.subject}" has been replied to by admin.`,
				icon: '/icons/icon-192x192.png',
				badge: '/icons/icon-72x72.png',
				data: {
					url: `/view/feedback?feedbackId=${feedback.feedbackId}`,
					feedbackId: feedback.feedbackId,
				},
			});
		} catch (notificationError) {
			console.error('Failed to send notification:', notificationError);
			// Don't fail the reply if notification fails
		}

		return json({
			success: true,
			message: 'Reply sent successfully',
		});
	} catch (error) {
		console.error("Reply to feedback error:", error);
		return json({ error: "Failed to send reply" }, { status: 500 });
	}
};
