import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const healthRoutes = Router();

healthRoutes.get("/", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.json({
      status: "ok",
      dependencies: {
        database: "ok",
      },
    });
  } catch {
    return res.status(503).json({
      status: "error",
      dependencies: {
        database: "error",
      },
    });
  }
});
