require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth");

const app = express();

// middleware
app.use(express.json());
app.use(cookieParser());

// routes
app.use("/api/auth", authRoutes);

// health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});