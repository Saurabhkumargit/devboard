import "dotenv/config";

import express from "express";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.js";
import boardRoutes from "./routes/boards.js";

import register from "./lib/metrics.js";
import metricsMiddleware from "./middleware/metrics.js";

import { initDB } from "./lib/prisma.js";

const app = express();

// middleware
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