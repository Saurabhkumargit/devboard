import { Router } from "express";
import prisma from "../lib/prisma.js";
import authMiddleware from "../middleware/auth.js";

const router = Router();

// POST /api/boards — Create a new board
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ message: "Valid name is required" });
    }

    const userId = req.user.id;

    // Create board and add creator as ADMIN member within a transaction
    const board = await prisma.$transaction(async (tx) => {
      const board = await tx.board.create({
        data: { name, description },
      });

      await tx.boardMember.create({
        data: {
          userId,
          boardId: board.id,
          role: "ADMIN",
        },
      });

      return board;
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

    // 3. Delete related data (Tasks, Members) first, then the board to avoid FK constraints
    await prisma.$transaction([
      prisma.task.deleteMany({ where: { boardId } }),
      prisma.boardMember.deleteMany({ where: { boardId } }),
      prisma.board.delete({ where: { id: boardId } }),
    ]);

    res.json({ message: "Board deleted successfully" });
  } catch (err) {
    console.error("Error in DELETE /boards:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.post("/:boardId/members", authMiddleware, async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { boardId } = req.params;
    const { userId } = req.body;

    // 1. Validate input
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // 2. Check requester is ADMIN
    const membership = await prisma.boardMember.findUnique({
      where: {
        userId_boardId: {
          userId: requesterId,
          boardId,
        },
      },
    });

    if (!membership || membership.role !== "ADMIN") {
      return res.status(404).json({ message: "Board not found" });
    }

    // 3. Check target user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 4. Add as MEMBER (do NOT trust client role)
    await prisma.boardMember.create({
      data: {
        userId,
        boardId,
        role: "MEMBER",
      },
    });

    res.status(201).json({ message: "User added to board" });
  } catch (err) {
    // handle duplicate membership
    if (err.code === "P2002") {
      return res.status(400).json({ message: "User already a member" });
    }

    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.delete("/:boardId/members/:userId", authMiddleware, async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { boardId, userId } = req.params;

    // 1. Check requester is ADMIN
    const requesterMembership = await prisma.boardMember.findUnique({
      where: {
        userId_boardId: {
          userId: requesterId,
          boardId,
        },
      },
    });

    if (!requesterMembership || requesterMembership.role !== "ADMIN") {
      return res.status(404).json({ message: "Board not found" });
    }

    // 2. Check target membership
    const targetMembership = await prisma.boardMember.findUnique({
      where: {
        userId_boardId: {
          userId,
          boardId,
        },
      },
    });

    if (!targetMembership) {
      return res.status(404).json({ message: "Member not found" });
    }

    // 3. Prevent removing last admin
    if (targetMembership.role === "ADMIN") {
      const adminCount = await prisma.boardMember.count({
        where: {
          boardId,
          role: "ADMIN",
        },
      });

      if (adminCount === 1) {
        return res.status(400).json({
          message: "Cannot remove the last admin",
        });
      }
    }

    // 4. Remove member
    await prisma.boardMember.delete({
      where: {
        userId_boardId: {
          userId,
          boardId,
        },
      },
    });

    res.json({ message: "Member removed successfully" });
  } catch (err) {
    console.error("Error removing member:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.post("/:boardId/tasks", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { boardId } = req.params;
    const { title, description } = req.body;

    // 1. Validate input
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ message: "Valid title is required" });
    }

    // 2. Check membership (authorization)
    const membership = await prisma.boardMember.findUnique({
      where: {
        userId_boardId: {
          userId,
          boardId,
        },
      },
    });

    if (!membership) {
      return res.status(404).json({ message: "Board not found" });
    }

    // 3. Create task
    const task = await prisma.task.create({
      data: {
        title,
        description,
        boardId,
        assigneeId: userId, // optional: assign creator by default
      },
    });

    res.status(201).json(task);
  } catch (err) {
    console.error("Error creating task:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.get("/:boardId/tasks", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { boardId } = req.params;

    const tasks = await prisma.task.findMany({
      where: {
        boardId,
        board: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        assigneeId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // If no tasks AND user not a member → still return 404
    if (tasks.length === 0) {
      // verify membership explicitly
      const membership = await prisma.boardMember.findUnique({
        where: {
          userId_boardId: {
            userId,
            boardId,
          },
        },
      });

      if (!membership) {
        return res.status(404).json({ message: "Board not found" });
      }
    }

    res.json(tasks);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.patch("/tasks/:taskId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;
    const { title, description, status, assigneeId } = req.body;

    // 1. Fetch task (trusted source)
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // 2. Check membership using DB-derived boardId
    const membership = await prisma.boardMember.findUnique({
      where: {
        userId_boardId: {
          userId,
          boardId: task.boardId,
        },
      },
    });

    if (!membership) {
      return res.status(404).json({ message: "Task not found" });
    }

    // 3. Update task (partial update)
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(status && { status }),
        ...(assigneeId && { assigneeId }),
      },
    });

    res.json(updatedTask);
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.delete("/tasks/:taskId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;

    // 1. Fetch task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // 2. Check membership
    const membership = await prisma.boardMember.findUnique({
      where: {
        userId_boardId: {
          userId,
          boardId: task.boardId,
        },
      },
    });

    if (!membership) {
      return res.status(404).json({ message: "Task not found" });
    }

    // 3. Delete task
    await prisma.task.delete({
      where: { id: taskId },
    });

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Error deleting task:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;