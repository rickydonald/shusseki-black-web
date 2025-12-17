import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ fetch }) => {
    try {
        const res = await fetch(
            "https://erp.loyolacollege.edu/loyolaonline/captchas",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: "",
            }
        );

        if (!res.ok) throw new Error("Captcha fetch failed");

        const captcha = await res.text();

        return json({
            captcha: captcha.trim(),
        });
    } catch (err) {
        throw error(500, "Failed to load captcha");
    }
};