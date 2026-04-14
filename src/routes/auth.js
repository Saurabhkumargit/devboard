import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import authMiddleware from "../middleware/auth.js";
import redis from "../lib/redis.js";
import rateLimiter from "../middleware/rateLimiter.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// registration
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
    });
  } catch (err) {
    if (err.code === "P2002" || (err.message && err.message.includes("Unique constraint failed"))) {
      return res.status(400).json({ message: "Email already exists" });
    }

    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// login
router.post("/login", rateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        jti: uuidv4(),
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true, // required for sameSite: "none"
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Response
    res.json({ message: "Logged in successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});


// logout
router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies?.token;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const ttl = decoded.exp - Math.floor(Date.now() / 1000);

      if (ttl > 0 && redis.status === "ready") {
        await redis.set(
          `blacklist:${decoded.jti}`,
          "true",
          "EX",
          ttl
        );
      }
    }

    // Clear cookie
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    res.json({ message: "Logged out" });
  }
});


export default router;

