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

router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const boards = await prisma.board.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });

    res.json(boards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:boardId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { boardId } = req.params;

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        members: {
          some: {
            userId: userId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    res.json(board);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:boardId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { boardId } = req.params;

    // 1. Check if user is ADMIN of the board
    const membership = await prisma.boardMember.findUnique({
      where: {
        userId_boardId: {
          userId,
          boardId,
        },
      },
    });

    // 2. If not member or not admin → 404 (hide existence)
    if (!membership || membership.role !== "ADMIN") {
      return res.status(404).json({ message: "Board not found" });
    }

    // 3. Delete board
    await prisma.board.delete({
      where: { id: boardId },
    });

    res.json({ message: "Board deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;