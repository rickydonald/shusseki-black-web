import { redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { Constants } from "$lib/constants";
import { randomBytes } from "crypto";

export const load: PageServerLoad = async ({ cookies, locals, url }) => {
    if (locals.user) {
        throw redirect(307, "/");
    }
    const paramError = url.searchParams.get("paramError");
    const randomId = randomBytes(29).toString("hex")

    const token = btoa(`${randomId}<>mins`);
    cookies.set(Constants._COOKIES.CSRF_COOKIE_NAME, token, {
        httpOnly: true,
        secure: import.meta.env.PROD ? true : false,
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60,
    });

    return {
        csrfToken: token,
        paramError
    }
}