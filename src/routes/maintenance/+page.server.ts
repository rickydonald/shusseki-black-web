import { redis } from "$lib/server/redis";
import type { PageServerLoad } from "./$types";
import crypto from "crypto";

interface MaintenanceContent {
    title: string;
    message: string;
    hash: string;
    cachedAt: number;
}

/**
 * Generate a hash from the content to detect changes
 */
function generateHash(title: string, message: string): string {
    return crypto.createHash("md5").update(`${title}||${message}`).digest("hex");
}

/**
 * Encode content to base64
 */
function encodeToBase64(data: MaintenanceContent): string {
    return Buffer.from(JSON.stringify(data)).toString("base64");
}

/**
 * Decode content from base64
 */
function decodeFromBase64(encoded: string): MaintenanceContent | null {
    try {
        const decoded = Buffer.from(encoded, "base64").toString("utf-8");
        return JSON.parse(decoded);
    } catch (error) {
        console.error("Error decoding maintenance cache:", error);
        return null;
    }
}

export const load: PageServerLoad = async () => {
    try {
        // Fetch maintenance content from Redis
        const [title, message, cachedData] = await Promise.all([
            redis.get<string>("app:maintenance_title"),
            redis.get<string>("app:maintenance_message"),
            redis.get<string>("app:maintenance_cache")
        ]);

        // Use defaults if not set in Redis
        const rawTitle = title || "We'll be back.";
        const rawMessage = message || "We're currently under maintenance.";

        // Sanitize HTML content to prevent XSS
        const maintenanceTitle = rawTitle;
        const maintenanceMessage = rawMessage;

        // Generate hash for the current content
        const currentHash = generateHash(maintenanceTitle, maintenanceMessage);

        // Load cached content
        let cachedContent: MaintenanceContent | null = null;
        if (cachedData) {
            cachedContent = decodeFromBase64(cachedData);
        }

        // If content has changed or no cache exists, update cache
        if (!cachedContent || cachedContent.hash !== currentHash) {
            const newContent: MaintenanceContent = {
                title: maintenanceTitle,
                message: maintenanceMessage,
                hash: currentHash,
                cachedAt: Date.now()
            };
            const encodedContent = encodeToBase64(newContent);
            // Store encoded cache in Redis (non-blocking)
            redis.set("app:maintenance_cache", encodedContent).catch(err => 
                console.error("Error saving maintenance cache:", err)
            );
        }

        return {
            title: maintenanceTitle,
            message: maintenanceMessage,
            cachedData: cachedContent ? encodeToBase64(cachedContent) : null
        };
    } catch (error) {
        console.error("Error loading maintenance content:", error);
        
        // Fallback: Try to load from existing cache
        try {
            const cachedData = await redis.get<string>("app:maintenance_cache");
            if (cachedData) {
                const cachedContent = decodeFromBase64(cachedData);
                if (cachedContent) {
                    return {
                        title: cachedContent.title,
                        message: cachedContent.message,
                        cachedData
                    };
                }
            }
        } catch (cacheError) {
            console.error("Error loading from cache:", cacheError);
        }

        // Ultimate fallback to hardcoded values
        return {
            title: "We'll be back.",
            message: "We're currently under maintenance.",
            cachedData: null
        };
    }
} 