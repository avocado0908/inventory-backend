import express from "express";
import { db } from "../db";
import { monthlyInventory } from "../db/schema";
import { and, eq, ilike, sql } from "drizzle-orm";

const router = express.Router();

// GET /monthlyInventory
router.get("/", async (req, res) => {
  try {
    const list = await db
      .select()
      .from(monthlyInventory)
      .orderBy(sql`id DESC`);

    res.status(200).json({
      data: list,
      pagination: {
        page: 1,
        pageSize: list.length,
        total: list.length,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.error("GET /monthlyInventory error:", error);
    res.status(500).json({ error: "Failed to fetch Monthly Inventorys" });
  }
});

export default router;