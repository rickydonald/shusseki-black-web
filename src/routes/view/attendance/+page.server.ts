import { Scrapper } from "$lib/models/attendance-scrapper";
import { userRateLimiter } from "$lib/server/rate-limiter";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        throw redirect(307, "/login");
    }
};