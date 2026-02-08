import express from "express";
import { db } from "../db";
import { suppliers } from "../db/schema";
import { eq, ilike, and, sql } from "drizzle-orm";

const router = express.Router();

/**
 * GET /suppliers
 * Returns a list of suppliers, optionally filtered by name
 */
router.get("/", async (req, res) => {
  try {
    const { search, page, limit } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);
    const limitPerPage = Math.max(1, Math.min(100, Number(limit) || 100));
    const offset = (currentPage - 1) * limitPerPage;

    const filters = [];

    if (search) {
      filters.push(ilike(suppliers.name, `%${search}%`));
    }

    const whereClause = filters.length ? and(...filters) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(suppliers)
      .where(whereClause);

    const totalCount = countResult[0]?.count ?? 0;

    const suppliersList = await db
      .select()
      .from(suppliers)
      .where(whereClause)
      .limit(limitPerPage)
      .offset(offset)
      .orderBy(sql`created_at DESC`);

    res.status(200).json({
      data: suppliersList,
      pagination: {
        page: currentPage,
        pageSize: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (error) {
    console.error("GET /suppliers error:", error);
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
});

/* =========================
   POST /suppliers (create)
========================= */
router.post("/", async (req, res) => {
  try {
    const { name, contactName, email, phone } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Supplier name is required" });
    }

    const [createdSupplier] = await db
      .insert(suppliers)
      .values({
        name: String(name),
        contactName: contactName ?? null,
        email: email ?? null,
        phone: phone ?? null,
      })
      .returning();

    res.status(201).json({ data: createdSupplier });
  } catch (error) {
    console.error("POST /suppliers error:", error);
    res.status(500).json({ error: "Failed to create supplier" });
  }
});

/* =========================
   PATCH /suppliers/:id (update)
========================= */
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, contactName, email, phone } = req.body;

  try {
    const updateData: Partial<typeof suppliers.$inferInsert> = {};

    if (name !== undefined) updateData.name = name;
    if (contactName !== undefined) updateData.contactName = contactName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    if (!Object.keys(updateData).length) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const [updatedSupplier] = await db
      .update(suppliers)
      .set(updateData)
      .where(eq(suppliers.id, Number(id)))
      .returning();

    res.status(200).json({ data: updatedSupplier });
  } catch (error) {
    console.error("PATCH /suppliers/:id error:", error);
    res.status(500).json({ error: "Failed to update supplier" });
  }
});

/* =========================
   DELETE /suppliers/:id
========================= */
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    await db.delete(suppliers).where(eq(suppliers.id, id));

    res.json({ success: true });
  } catch (error) {
    console.error("DELETE /suppliers/:id error:", error);
    res.status(500).json({ error: "Failed to delete supplier" });
  }
});

export default router;
