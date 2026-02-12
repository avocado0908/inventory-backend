import express from "express";
import { db } from "../db";
import {
  branchAssignments,
  categories,
  monthlyInventory,
  products,
  stocktakeSummaries,
} from "../db/schema";
import { eq, sql } from "drizzle-orm";

const router = express.Router();

/* =========================
   GET /stocktake-summaries
========================= */
router.get("/", async (_req, res) => {
  try {
    const list = await db
      .select({
        id: stocktakeSummaries.id,
        branchAssignmentId: stocktakeSummaries.branchAssignmentId,
        grandTotal: stocktakeSummaries.grandTotal,
        totalsByCategory: stocktakeSummaries.totalsByCategory,
        createdAt: stocktakeSummaries.createdAt,
        updatedAt: stocktakeSummaries.updatedAt,
        assignedMonth: branchAssignments.assignedMonth,
        branchId: branchAssignments.branchId,
        assignmentName: branchAssignments.name,
      })
      .from(stocktakeSummaries)
      .innerJoin(
        branchAssignments,
        eq(branchAssignments.id, stocktakeSummaries.branchAssignmentId)
      )
      .orderBy(sql`created_at DESC`);

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
    console.error("GET /stocktake-summaries error:", error);
    res.status(500).json({ error: "Failed to fetch stocktake summaries" });
  }
});

/* =========================
   POST /stocktake-summaries/finish
   Create snapshot + mark assignment done
========================= */
router.post("/finish", async (req, res) => {
  try {
    const { branchAssignmentId } = req.body ?? {};

    if (!branchAssignmentId) {
      return res.status(400).json({ error: "branchAssignmentId is required" });
    }

    const assignmentId = Number(branchAssignmentId);

    // Aggregate totals by category
    const rows = await db
      .select({
        category: categories.name,
        totalValue: sql<number>`COALESCE(SUM(${monthlyInventory.stockValue}), 0)`,
      })
      .from(monthlyInventory)
      .innerJoin(products, eq(products.id, monthlyInventory.productId))
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .where(eq(monthlyInventory.branchAssignmentsId, assignmentId))
      .groupBy(categories.name);

    const totalsByCategory = rows.map((row) => ({
      category: row.category,
      totalValue: Number(row.totalValue ?? 0),
    }));

    const grandTotal = totalsByCategory.reduce(
      (sum, row) => sum + (row.totalValue ?? 0),
      0
    );

    const [summary] = await db
      .insert(stocktakeSummaries)
      .values({
        branchAssignmentId: assignmentId,
        grandTotal: grandTotal.toFixed(2),
        totalsByCategory,
      })
      .onConflictDoUpdate({
        target: [stocktakeSummaries.branchAssignmentId],
        set: {
          grandTotal: grandTotal.toFixed(2),
          totalsByCategory,
        },
      })
      .returning();

    await db
      .update(branchAssignments)
      .set({ status: "done" })
      .where(eq(branchAssignments.id, assignmentId));

    return res.status(201).json({ data: summary });
  } catch (error) {
    console.error("POST /stocktake-summaries/finish error:", error);
    return res.status(500).json({ error: "Failed to create stocktake summary" });
  }
});

export default router;
