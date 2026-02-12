import express from "express";
import { db } from "../db"; // your Drizzle database instance
import { uom } from "../db/schema"; // your uom table
import { eq, ilike, and, or, sql } from "drizzle-orm";

const router = express.Router();

/**
 * GET /uom
 * Returns a list of uom, optionally filtered by name
 */
router.get("/", async (req, res) => {
  try {
    const { search, page, limit } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);
    const limitPerPage = Math.max(1, Math.min(100, Number(limit) || 100));
    const offset = (currentPage - 1) * limitPerPage;

    const filterConditions = [];

    if (search) {
      filterConditions.push(ilike(uom.name, `%${search}%`));
    }

    const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(uom)
      .where(whereClause);

    const totalCount = countResult[0]?.count ?? 0;

    // Get paginated data
    const uomList = await db
      .select()
      .from(uom)
      .where(whereClause)
      .limit(limitPerPage)
      .offset(offset)
      .orderBy(sql`created_at DESC`);

    res.status(200).json({
      data: uomList,
      pagination: {
        page: currentPage,
        pageSize: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (error) {
    console.error("GET /uom error:", error);
    res.status(500).json({ error: "Failed to fetch uom" });
  }
});

/* =========================
   POST /uom (create)
========================= */
router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [createdUom] = await db
      .insert(uom)
      .values({
        name: String(name),
        description: description ?? null,
      })
      .returning();

    res.status(201).json({ data: createdUom });
  } catch (error) {
    console.error("POST /uom error:", error);
    res.status(500).json({ error: "Failed to create uom" });
  }
});

/* =========================
   PATCH /uom/:id (update)
========================= */
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const updateData: Partial<typeof uom.$inferInsert> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const [updatedUom] = await db
      .update(uom)
      .set(updateData)
      .where(eq(uom.id, Number(id)))
      .returning();

    res.status(200).json({ data: updatedUom });
  } catch (error) {
    console.error("PATCH /uom/:id error:", error);
    res.status(500).json({ error: "Failed to update uom" });
  }
});

/* =========================
   DELETE /uom/:id
========================= */
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(uom).where(eq(uom.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE /uom/:id error:", error);
    res.status(500).json({ error: "Failed to delete uom" });
  }
});

export default router;
