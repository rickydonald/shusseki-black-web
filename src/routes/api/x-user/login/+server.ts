import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import jwt from 'jsonwebtoken';
import db from '$lib/db';
import { xUsers } from '$lib/db/schema/x-users';
import { eq } from 'drizzle-orm';
import { XUSER_JWT_SECRET } from '$env/static/private';
import { compareSync } from 'bcrypt-ts';
import { DateTime } from 'luxon';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { username, password } = await request.json();

		if (!username || !password) {
			return json({ error: 'Username and password required' }, { status: 400 });
		}

		const xUser = await db.select().from(xUsers).where(eq(xUsers.username, username)).limit(1);
		if (xUser.length === 0) {
			return json({ error: 'Invalid credentials' }, { status: 401 });
		}
		const user = xUser[0];
		const verifyPassword = compareSync(password, user.password)

		if (username === user.username && verifyPassword) {
			const jwtToken = jwt.sign({
				userId: user.userId,
				username: user.username,
				role: user.role,
			}, XUSER_JWT_SECRET, { expiresIn: '2h' });

			cookies.set('x_user_auth', jwtToken, {
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'strict',
				maxAge: 60 * 60 * 24
			});

			await db.update(xUsers).set({
				lastLogin: DateTime.now().toUTC().toISO()
			}).where(eq(xUsers.username, user.username));

			return json({ success: true });
		}

		return json({ error: 'Invalid credentials' }, { status: 401 });
	} catch (error: any) {
		return json({ error: 'Login failed', details: error.message }, { status: 500 });
	}
};
