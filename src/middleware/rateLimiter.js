import redis from "../lib/redis.js";

const WINDOW_SIZE = 15 * 60; // 15 minutes (in seconds)
const MAX_REQUESTS = 5;

export default async function rateLimiter(req, res, next) {
  try {
    const ip = req.ip;

    const key = `rate_limit:${ip}`;

    if (redis.status !== "ready") {
      return next(); // Fail open silently if Redis is not connected
    }

    const requests = await redis.incr(key);

    // set expiry only on first request
    if (requests === 1) {
      await redis.expire(key, WINDOW_SIZE);
    }

    if (requests > MAX_REQUESTS) {
      return res.status(429).json({
        message: "Too many requests, try again later",
      });
    }

    next();
  } catch (err) {
    console.error("Rate limiter error:", err);

    // fail open (important decision)
    next();
  }
};