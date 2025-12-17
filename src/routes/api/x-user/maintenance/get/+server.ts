import { redis } from "$lib/server/redis";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { xUserProtect } from "$lib/server/auth";

export const GET: RequestHandler = async (event) => {
	const xUserAuth = xUserProtect(event)
	if (xUserAuth) return xUserAuth

	try {
		const [maintenanceMode, title, message] = await Promise.all([
			redis.get<string>("app:maintenance_mode"),
			redis.get<string>("app:maintenance_title"),
			redis.get<string>("app:maintenance_message"),
		]);

		return json({
			maintenanceMode,
			title: title || "We'll be back soon!",
			message: message || "We're currently under maintenance.",
		});
	} catch (error) {
		console.error("Error fetching maintenance settings:", error);
		return json(
			{ error: "Failed to fetch maintenance settings" },
			{ status: 500 },
		);
	}
};
