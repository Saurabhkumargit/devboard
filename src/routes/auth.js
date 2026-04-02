const express = require("express");
const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");

const router = express.Router();

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
    if (err.code === "P2002") {
      return res.status(400).json({ message: "Email already exists" });
    }

    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;