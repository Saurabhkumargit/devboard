import "dotenv/config";

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import boardRoutes from "./routes/boards.js";

import register from "./lib/metrics.js";
import metricsMiddleware from "./middleware/metrics.js";

import { initDB } from "./lib/prisma.js";

const app = express();

// 🔥 FORCE CORS HEADERS (handles EVERYTHING including preflight)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://devboard-rouge.vercel.app");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );

  // ✅ handle preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// optional (safe to keep)
app.use(cors({
  origin: true,
  credentials: true,
}));

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(metricsMiddleware);

// routes
app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);

// health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

const PORT = process.env.PORT || 3000;

await initDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});