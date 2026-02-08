import express from "express";
import { db } from "../db";
import { branches } from "../db/schema";
import { eq, ilike, and, sql } from "drizzle-orm";

const router = express.Router();

// GET /branches
router.get("/", async (req, res) => {
  try {
    const { search, page, limit } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);
    const limitPerPage = Math.max(1, Math.min(100, Number(limit) || 100));
    const offset = (currentPage - 1) * limitPerPage;

    const filters = [];
    if (search) {
      filters.push(ilike(branches.name, `%${search}%`));
    }
    const whereClause = filters.length ? and(...filters) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(branches)
      .where(whereClause);

    const totalCount = countResult[0]?.count ?? 0;

    const list = await db
      .select()
      .from(branches)
      .where(whereClause)
      .limit(limitPerPage)
      .offset(offset)
      .orderBy(sql`created_at DESC`);

    res.status(200).json({
      data: list,
      pagination: {
        page: currentPage,
        pageSize: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (error) {
    console.error("GET /branches error:", error);
    res.status(500).json({ error: "Failed to fetch branches" });
  }
});

// GET /branches/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [branch] = await db.select().from(branches).where(eq(branches.id, id));
    if (!branch) {
      return res.status(404).json({ error: "Branch not found" });
    }
    res.status(200).json({ data: branch });
  } catch (error) {
    console.error("GET /branches/:id error:", error);
    res.status(500).json({ error: "Failed to fetch branch" });
  }
});

// POST /branches
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Branch name is required" });
    }

    const [created] = await db
      .insert(branches)
      .values({
        name: String(name),
      })
      .returning();

    res.status(201).json({ data: created });
  } catch (error) {
    console.error("POST /branches error:", error);
    res.status(500).json({ error: "Failed to create branch" });
  }
});

// PATCH /branches/:id
router.patch("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name } = req.body;

    const updateData: Partial<typeof branches.$inferInsert> = {};
    if (name !== undefined) updateData.name = name;

    if (!Object.keys(updateData).length) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const [updated] = await db
      .update(branches)
      .set(updateData)
      .where(eq(branches.id, id))
      .returning();

    res.status(200).json({ data: updated });
  } catch (error) {
    console.error("PATCH /branches/:id error:", error);
    res.status(500).json({ error: "Failed to update branch" });
  }
});

// DELETE /branches/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(branches).where(eq(branches.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE /branches/:id error:", error);
    res.status(500).json({ error: "Failed to delete branch" });
  }
});

export default router;
