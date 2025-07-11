"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = exports.rateLimiterMiddleware = void 0;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const redis_1 = require("redis");
const redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD
});
redisClient.connect().catch(console.error);
const rateLimiter = new rate_limiter_flexible_1.RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '100'),
    duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000') / 1000,
});
const rateLimiterMiddleware = async (req, res, next) => {
    try {
        await rateLimiter.consume(req.ip ?? 'unknown');
        next();
    }
    catch (rejRes) {
        const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
        res.set('Retry-After', String(secs));
        res.status(429).json({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${secs} seconds.`
        });
    }
};
exports.rateLimiterMiddleware = rateLimiterMiddleware;
exports.rateLimiter = exports.rateLimiterMiddleware;
//# sourceMappingURL=rateLimiter.js.map