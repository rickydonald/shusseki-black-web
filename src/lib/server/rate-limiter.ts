import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

export const userRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    analytics: true,
});

/**
 * Generic rate limiting function
 */
export async function rateLimit(options: {
    key: string;
    limit: number;
    window: number; // in seconds
}): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(options.limit, `${options.window} s`),
        analytics: false,
    });

    const result = await limiter.limit(options.key);

    return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
    };
}

const lockoutStages = [
    { attempts: 5, duration: 60 },
    { attempts: 10, duration: 600 },
    { attempts: 15, duration: 3600 },
];
export async function checkBruteForce(dno: string) {
    const lockoutKey = `lockout:${dno}`;
    const ttl = await redis.ttl(lockoutKey);

    if (ttl > 0) {
        // Already locked — return remaining lockout time
        return { locked: true, failures: await redis.get<number>(`login_failures:${dno}`), retryAfter: ttl };
    }

    // Not locked — check failure count
    const failures = (await redis.get<number>(`login_failures:${dno}`)) ?? 0;

    // Pick the highest matching stage
    const stage = [...lockoutStages].reverse().find(s => failures >= s.attempts);

    if (stage) {
        // Lock user for stage.duration seconds
        await redis.set(lockoutKey, "1", { ex: stage.duration });
        return { locked: true, failures, retryAfter: stage.duration };
    }

    return { locked: false, failures, retryAfter: 0 };
}
export async function recordFailure(dno: string) {
    const key = `login_failures:${dno}`;
    const failures = (await redis.incr(key)) ?? 1;
    // Keep failure count for 24h to evaluate progressive lockouts
    await redis.expire(key, 60 * 60 * 24);
    return failures;
}
export async function resetFailures(dno: string) {
    await Promise.all([
        redis.del(`login_failures:${dno}`),
        redis.del(`lockout:${dno}`)
    ]);
}