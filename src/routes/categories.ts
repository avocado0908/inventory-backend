import express from "express";
import { db } from "../db"; // your Drizzle database instance
import { categories } from "../db/schema"; // your categories table
import { eq, ilike, and, or, sql } from "drizzle-orm";

const router = express.Router();

/**
 * GET /categories
 * Returns a list of categories, optionally filtered by name
 */
router.get("/", async (req, res) => {
  try {
    const { search, page, limit } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);
    const limitPerPage = Math.max(1, Math.min(100, Number(limit) || 100));
    const offset = (currentPage - 1) * limitPerPage;

    const filterConditions = [];

    if (search) {
      filterConditions.push(ilike(categories.name, `%${search}%`));
    }

    const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(categories)
      .where(whereClause);

    const totalCount = countResult[0]?.count ?? 0;

    // Get paginated data
    const categoriesList = await db
      .select()
      .from(categories)
      .where(whereClause)
      .limit(limitPerPage)
      .offset(offset)
      .orderBy(sql`created_at DESC`);

    res.status(200).json({
      data: categoriesList,
      pagination: {
        page: currentPage,
        pageSize: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (error) {
    console.error("GET /categories error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

/* =========================
   POST /categories (create)
========================= */
router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [createdCategory] = await db
      .insert(categories)
      .values({
        name: String(name),
        description: description ?? null,
      })
      .returning();

    res.status(201).json({ data: createdCategory });
  } catch (error) {
    console.error("POST /categories error:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

/* =========================
   PATCH /categories/:id (update)
========================= */
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const updateData: Partial<typeof categories.$inferInsert> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const [updatedCategory] = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, Number(id)))
      .returning();

    res.status(200).json({ data: updatedCategory });
  } catch (error) {
    console.error("PATCH /categories/:id error:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
});

/* =========================
   DELETE /categories/:id
========================= */
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    await db.delete(categories).where(eq(categories.id, id));

    res.json({ success: true });
  } catch (error) {
    console.error("DELETE /categories/:id error:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

export default router;
