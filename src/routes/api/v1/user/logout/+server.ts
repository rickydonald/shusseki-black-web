import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Constants } from '$lib/constants';
import { protect } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
    const authCheck = protect(event);
    if (authCheck) return authCheck;

    const { locals, cookies } = event;
    locals.user = null;
    locals.shussekiUser = null;
    cookies.delete(Constants._COOKIES.SESSION_COOKIE_NAME, { path: '/' });
    
    throw redirect(302, '/');
};