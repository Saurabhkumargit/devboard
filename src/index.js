import "dotenv/config";

import express from "express";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.js";
import boardRoutes from "./routes/boards.js";

const app = express();

// middleware
app.use(express.json());
app.use(cookieParser());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);

// health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});