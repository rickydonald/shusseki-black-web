import { bytesToHex, hexToBytes, managedNonce, randomBytes } from '@noble/ciphers/utils.js';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { ERP_SESSION_COOKIE_ENCRYPTION_KEY } from '$env/static/private';

export class Wap7 {
    static keyGenerator() {
        const key = randomBytes(32);
        return bytesToHex(key);
    }

    static encryptSessionCookie(sessionCookie: string): string {
        const key = hexToBytes(ERP_SESSION_COOKIE_ENCRYPTION_KEY);
        const chacha = managedNonce(xchacha20poly1305)(key);
        const dataEncoded = new TextEncoder().encode(sessionCookie);
        return bytesToHex(chacha.encrypt(dataEncoded));
    }

    static decryptSessionCookie(encryptedSessionCookie: string): string {
        const key = hexToBytes(ERP_SESSION_COOKIE_ENCRYPTION_KEY);
        const chacha = managedNonce(xchacha20poly1305)(key);
        const encryptedBytes = hexToBytes(encryptedSessionCookie);
        const decryptedBytes = chacha.decrypt(encryptedBytes);
        return new TextDecoder().decode(decryptedBytes);
    }
}