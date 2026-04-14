import jwt from "jsonwebtoken";
import redis from "../lib/redis.js";

export default async function auth(req, res, next) {
  try {
    // Extract token from cookie
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is blacklisted (only if Redis is available)
    if (redis.status === "ready") {
      const isBlocked = await redis.get(`blacklist:${decoded.jti}`);
      if (isBlocked) {
        return res.status(401).json({ message: "Token invalidated" });
      }
    }

    // Attach user to request
    req.user = {
      id: decoded.userId,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}