// See https://svelte.dev/docs/kit/types#app.d.ts

import type { ShussekiUser, User } from "$lib/types/session.type";
import type { Users } from "./generated/prisma";

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: User | null;
			shussekiUser: ShussekiUser | null;
			getSession?: () => Promise<{ user: User } | null>;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export { };
