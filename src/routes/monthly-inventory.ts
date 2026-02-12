import express from "express";
import { db } from "../db";
import { monthlyInventory, products } from "../db/schema";
import { eq, sql } from "drizzle-orm";

const router = express.Router();

// GET /monthly-inventory
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
    console.error("GET /monthly-inventory error:", error);
    res.status(500).json({ error: "Failed to fetch monthly inventory" });
  }
});

// POST /monthly-inventory (create or update count)
router.post("/", async (req, res) => {
  try {
    const { branchAssignmentsId, productId, quantity } = req.body ?? {};

    if (!branchAssignmentsId || !productId || quantity === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const qty = Number(quantity);
    if (Number.isNaN(qty) || qty < 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    const [product] = await db
      .select({ price: products.price })
      .from(products)
      .where(eq(products.id, Number(productId)));

    const price = Number(product?.price ?? 0);
    const stockValue = (price * qty).toFixed(2);

    const [saved] = await db
      .insert(monthlyInventory)
      .values({
        branchAssignmentsId: Number(branchAssignmentsId),
        productId: Number(productId),
        quantity: qty,
        stockValue,
      })
      .onConflictDoUpdate({
        target: [monthlyInventory.branchAssignmentsId, monthlyInventory.productId],
        set: {
          quantity: qty,
          stockValue,
        },
      })
      .returning();

    return res.status(200).json({ data: saved });
  } catch (error) {
    console.error("POST /monthly-inventory error:", error);
    return res.status(500).json({ error: "Failed to save monthly inventory" });
  }
});

export default router;
