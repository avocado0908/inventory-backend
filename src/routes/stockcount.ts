import express from "express";
import { db } from "../db";
import { monthlyInventory, products } from "../db/schema";
import { and, eq, sql } from "drizzle-orm";

const router = express.Router();

function normalizeMonth(input: string) {
  if (!input) return null;
  if (/^\d{4}-\d{2}$/.test(input)) return `${input}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  return null;
}

// GET /stockcount?branchId=1&month=2026-01
router.get("/", async (req, res) => {
  try {
    const branchId = Number(req.query.branchId);
    const monthInput = String(req.query.month ?? "");
    const month = normalizeMonth(monthInput);

    if (!branchId || !month) {
      return res.status(400).json({ error: "branchId and month are required" });
    }

    const list = await db
      .select()
      .from(monthlyInventory)
      .where(and(eq(monthlyInventory.branchId, branchId), eq(monthlyInventory.month, month)));

    res.status(200).json({ data: list });
  } catch (error) {
    console.error("GET /stockcount error:", error);
    res.status(500).json({ error: "Failed to fetch stock counts" });
  }
});

// GET /stockcount/months?branchId=1
router.get("/months", async (req, res) => {
  try {
    const branchId = Number(req.query.branchId);
    if (!branchId) {
      return res.status(400).json({ error: "branchId is required" });
    }

    const rows = await db
      .select({ month: monthlyInventory.month })
      .from(monthlyInventory)
      .where(eq(monthlyInventory.branchId, branchId))
      .groupBy(monthlyInventory.month)
      .orderBy(sql`month DESC`);

    res.status(200).json({ data: rows });
  } catch (error) {
    console.error("GET /stockcount/months error:", error);
    res.status(500).json({ error: "Failed to fetch months" });
  }
});

// POST /stockcount
router.post("/", async (req, res) => {
  try {
    const { branchId, productId, month, quantity } = req.body;
    const normalizedMonth = normalizeMonth(String(month ?? ""));

    if (!branchId || !productId || !normalizedMonth || quantity === undefined) {
      return res.status(400).json({ error: "branchId, productId, month, quantity are required" });
    }

    const [product] = await db
      .select({ price: products.price })
      .from(products)
      .where(eq(products.id, Number(productId)));

    const price = product?.price ? Number(product.price) : 0;
    const stockValue = price * Number(quantity);

    const [saved] = await db
      .insert(monthlyInventory)
      .values({
        branchId: Number(branchId),
        productId: Number(productId),
        month: normalizedMonth,
        quantity: Number(quantity),
        stockValue,
      })
      .onConflictDoUpdate({
        target: [
          monthlyInventory.branchId,
          monthlyInventory.productId,
          monthlyInventory.month,
        ],
        set: {
          quantity: Number(quantity),
          stockValue,
        },
      })
      .returning();

    res.status(200).json({ data: saved });
  } catch (error) {
    console.error("POST /stockcount error:", error);
    res.status(500).json({ error: "Failed to save stock count" });
  }
});

export default router;
