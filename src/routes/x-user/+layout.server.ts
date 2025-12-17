import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import jwt from 'jsonwebtoken'
import { XUSER_JWT_SECRET } from '$env/static/private';

export const load: LayoutServerLoad = async ({ locals, cookies, url }) => {
	// if (!locals.user) {
	// 	throw redirect(307, '/login');
	// }
	// if (locals.user.userId !== "25-PCS-018") {
	// 	throw redirect(307, '/login');
	// }

	if (url.pathname === '/x-user/login') {
		return {
			authenticated: false,
		};
	}

	const xUserAuth = cookies.get('x_user_auth');

	if (!xUserAuth) {
		throw redirect(302, '/x-user/login');
	}

	const validToken = jwt.verify(xUserAuth, XUSER_JWT_SECRET);

	if (!validToken) {
		throw redirect(302, '/x-user/login');
	}

	return {
		authenticated: true,
	};
};
