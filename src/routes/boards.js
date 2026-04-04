import { Router } from "express";
import prisma from "../lib/prisma.js";
import authMiddleware from "../middleware/auth.js";

const router = Router();

// POST /api/boards — Create a new board
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const userId = req.user.id;

    // Create board
    const board = await prisma.board.create({
      data: { name, description },
    });

    // Add creator as ADMIN member
    await prisma.boardMember.create({
      data: {
        userId,
        boardId: board.id,
        role: "ADMIN",
      },
    });

    res.status(201).json(board);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;