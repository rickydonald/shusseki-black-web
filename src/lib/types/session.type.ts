/**
 * Session information stored in JWT
 */
export interface Session {
    sessionId: string;
    userId: string;
    creds: ScrapperParams;
    role: UserRole;
    shift: number;
    issuedAt: number;
    expiresAt: number;
}
export interface ScrapperParams {
    username: string;
    password: string;
}

/**
 * User information stored in locals
 */
export interface User {
    sessionId: string;
    userId: string;
    fullName: string;
    role: UserRole;
    shift: number;
    userType?: UserRole;
    session?: string;
}
export interface ShussekiUser {
    userId: string;
    fullName: string;
    isBanned: boolean;
    role: UserRole;
    createdAt: string;
}

export type UserRole = "user" | "x-user" | "x-admin-user";


export interface ErpSession {
    creds: {
        username: string;
        password: string;
    },
    cookies: string;
}