import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import db from "$lib/db";
import { userFeedbacks } from "$lib/db/schema/users";
import { nanoid } from "nanoid";
import { protect } from "$lib/server/auth";

export const POST: RequestHandler = async (event) => {
	const authCheck = protect(event);
	if (authCheck) return authCheck;

	const { request, locals } = event;

	try {

		const body = await request.json();
		const { feedbackType, subject, feedback, errorCode } = body;

		// Validation
		if (!feedbackType || !["bug", "feature", "problem", "suggestion", "others"].includes(feedbackType)) {
			return json({ error: "Invalid feedback type" }, { status: 400 });
		}

		if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
			return json({ error: "Subject is required" }, { status: 400 });
		}

		if (subject.length > 191) {
			return json({ error: "Subject is too long (max 191 characters)" }, { status: 400 });
		}

		if (!feedback || typeof feedback !== "string" || feedback.trim().length === 0) {
			return json({ error: "Feedback is required" }, { status: 400 });
		}

		if (feedback.length < 10) {
			return json({ error: "Feedback must be at least 10 characters" }, { status: 400 });
		}

		if (feedback.length > 500) {
			return json({ error: "Feedback is too long (max 500 characters)" }, { status: 400 });
		}

		if (errorCode && typeof errorCode === "string" && errorCode.length > 191) {
			return json({ error: "Error code is too long (max 191 characters)" }, { status: 400 });
		}

		// Generate unique feedback ID
		const feedbackId = nanoid(16);

		// Insert feedback into database
		const [newFeedback] = await db.insert(userFeedbacks).values({
			feedbackId,
			userId: locals.user!.userId,
			feedbackType: feedbackType as "bug" | "feature" | "problem" | "suggestion" | "others",
			subject: subject.trim(),
			feedback: feedback.trim(),
			errorCode: errorCode && typeof errorCode === "string" ? errorCode.trim() : null,
			isReplied: false,
			reply: null,
			createdAt: new Date(),
			updatedAt: new Date().toISOString(),
		});

		return json({
			success: true,
			feedbackId,
			message: "Feedback submitted successfully",
		}, { status: 201 });

	} catch (error) {
		console.error("Feedback submission error:", error);
		return json({ error: "Failed to submit feedback" }, { status: 500 });
	}
};
