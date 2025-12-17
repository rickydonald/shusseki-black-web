import { redis } from "./redis";

/**
 * Check if the application is in maintenance mode.
 * @returns boolean
 */
export async function isMaintenanceMode(): Promise<boolean> {
    const maintenanceMode = await redis.get("app:maintenance_mode");
    return maintenanceMode ? true : false;
}