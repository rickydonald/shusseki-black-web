import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	// Clear authentication cookie
	cookies.delete('x_user_auth', { path: '/' });
	
	return json({ success: true });
};
