import { redis } from "$lib/server/redis";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import jwt from "jsonwebtoken";
import { XUSER_JWT_SECRET } from "$env/static/private";
import { xUserProtect } from "$lib/server/auth";

export const POST: RequestHandler = async (event) => {
	const xUserAuthCheck = xUserProtect(event);
	if (xUserAuthCheck) return xUserAuthCheck;

	try {
		const body = await event.request.json();
		const { enabled, title, message } = body;

		if (typeof enabled !== "boolean") {
			return json({ error: "Invalid enabled value" }, { status: 400 });
		}

		const maintenanceTitle = title || "We'll be back soon!";
		const maintenanceMessage = message || "We're currently under maintenance.";

		await Promise.all([
			redis.set("app:maintenance_mode", enabled ? "true" : "false"),
			redis.set("app:maintenance_title", maintenanceTitle),
			redis.set("app:maintenance_message", maintenanceMessage),
		]);

		return json({
			success: true,
			message: "Maintenance settings updated successfully",
		});
	} catch (error) {
		console.error("Error updating maintenance settings:", error);
		return json(
			{ error: "Failed to update maintenance settings" },
			{ status: 500 },
		);
	}
};
