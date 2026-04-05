import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  lazyConnect: true,
  maxRetriesPerRequest: 0,
  retryStrategy: () => null, // disable auto-reconnect when Redis is unavailable
});

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (err) => {
  // Log once without stack spam; ECONNREFUSED just means Redis isn't running
  if (err.code === "ECONNREFUSED") {
    // suppress repeated noise — warning already shown on first error
    return;
  }
  console.error("Redis error:", err.message);
});

redis
  .connect()
  .catch(() => console.warn("⚠️  Redis unavailable — caching disabled. Start Redis to enable it."));

export default redis;