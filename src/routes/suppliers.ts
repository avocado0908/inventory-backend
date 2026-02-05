import express from "express";
import { db } from "../db"; // your Drizzle database instance
import { suppliers } from "../db/schema"; // your suppliers table
import { eq, ilike, and, or, sql } from "drizzle-orm";

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

    const filterConditions = [];

    if (search) {
      filterConditions.push(ilike(suppliers.name, `%${search}%`));
    }

    const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(suppliers)
      .where(whereClause);

    const totalCount = countResult[0]?.count ?? 0;

    // Get paginated data
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

export default router;
