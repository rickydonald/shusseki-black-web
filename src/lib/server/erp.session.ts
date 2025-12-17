import type { Cookie } from "playwright-core";

let cachedCookies: Cookie[] | null = null;
let expiresAt = 0;

export function getCachedCookies(): Cookie[] | null {
    if (cachedCookies && Date.now() < expiresAt) {
        return cachedCookies;
    }
    return null;
}

export function setCachedCookies(cookies: Cookie[]) {
    cachedCookies = cookies;
    expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
}