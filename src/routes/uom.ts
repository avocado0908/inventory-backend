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

export default router;
