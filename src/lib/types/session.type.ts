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
    departmentNumber: string;
    dateOfBirth: string;
}

/**
 * User information stored in locals
 */
export interface User {
    sessionId: string;
    userId: string;
    creds: ScrapperParams;
    fullName: string;
    role: UserRole;
    shift: number;
    userType?: UserRole;
}
export interface ShussekiUser {
    userId: string;
    creds: ScrapperParams;
    fullName: string;
    isBanned: boolean;
    role: UserRole;
    createdAt: string;
}

export type UserRole = "user" | "x-user" | "x-admin-user";