import { eq, ilike, or, and, desc, sql, getTableColumns } from "drizzle-orm"
import express from "express";
import { products, categories, suppliers, uom } from "../db/schema";
import { db } from "../db";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { search, category, page, limit } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);
    const limitPerPage = Math.max(1, Math.min(100, Number(limit) || 10));
    const offset = (currentPage - 1) * limitPerPage;

    const filterConditions = [];

    if (search) {
      filterConditions.push(ilike(products.name, `%${search}%`));
    }

    if (category) {
      const categoryId = Number(category);
      if (!Number.isNaN(categoryId)) {
        filterConditions.push(eq(products.categoryId, categoryId));
      } else {
        filterConditions.push(ilike(categories.name, `%${category}%`));
      }
    }

    const whereClause =
      filterConditions.length > 0 ? and(...filterConditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause);

    const totalCount = countResult[0]?.count ?? 0;

    const productsList = await db
      .select({
        ...getTableColumns(products),
        category: { ...getTableColumns(categories) },
        supplier: { ...getTableColumns(suppliers) },
        uom: { ...getTableColumns(uom) },
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
      .leftJoin(uom, eq(products.uomId, uom.id))
      .where(whereClause)
      .orderBy(desc(products.createdAt))
      .limit(limitPerPage)
      .offset(offset);

    res.status(200).json({
      data: productsList,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (e) {
    console.error(`GET /products error:`, e);
    res.status(500).json({ error: "Failed to get products" });
  }
});

/* =========================
   POST /products (create)
========================= */
router.post("/", async (req, res) => {
    try {
        const { name, categoryId, supplierId, uomId, pkg, barcode, price } = req.body;

        // Basic validation (important for NOT NULL columns)
        if (!name || !categoryId || !supplierId || !uomId || pkg === undefined) {
            return res.status(400).json({
                error: "Missing required fields",
            });
        }

        const [createdProduct] = await db
            .insert(products)
            .values({
                name: String(name),
                categoryId: Number(categoryId),
                supplierId: Number(supplierId),
                uomId: Number(uomId),
                pkg: Number(pkg),
                barcode: barcode ?? null,
                price: price !== undefined ? Number(price) : null,
            })
            .returning();

        res.status(201).json({
            data: createdProduct,
        });
    } catch (e) {
        console.error("POST /products error:", e);
        res.status(500).json({
            error: "Failed to create product",
        });
    }
});


// GET /products/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [product] = await db
      .select({
        ...getTableColumns(products),
        category: { ...getTableColumns(categories) },
        supplier: { ...getTableColumns(suppliers) },
        uom: { ...getTableColumns(uom) },
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
      .leftJoin(uom, eq(products.uomId, uom.id))
      .where(eq(products.id, Number(id)));

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json({ data: product });
  } catch (e) {
    console.error(`GET /products/:id error:`, e);
    res.status(500).json({ error: "Failed to get product" });
  }
});


/* =========================
   PUT /products/:id (update)
========================= */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, categoryId, supplierId, uomId, pkg, barcode, price } = req.body;

  try {
    const [updatedProduct] = await db
      .update(products)
      .set({ name, categoryId, supplierId, uomId, pkg, barcode, price })
      .where(eq(products.id, Number(id)))
      .returning();

    res.status(200).json({ data: updatedProduct });
  } catch (error) {
    console.error("PUT /products/:id error:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

/* =========================
   PATCH /products/:id (update)
========================= */
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, categoryId, supplierId, uomId, pkg, barcode, price } = req.body;

  try {
    const updateData: Partial<typeof products.$inferInsert> = {};
    if (name !== undefined) updateData.name = name;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (supplierId !== undefined) updateData.supplierId = supplierId;
    if (uomId !== undefined) updateData.uomId = uomId;
    if (pkg !== undefined) updateData.pkg = pkg;
    if (barcode !== undefined) updateData.barcode = barcode;
    if (price !== undefined) updateData.price = price;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const [updatedProduct] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, Number(id)))
      .returning();

    res.status(200).json({ data: updatedProduct });
  } catch (error) {
    console.error("PATCH /products/:id error:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

/* =========================
   DELETE /products/:id
========================= */
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    await db.delete(products).where(eq(products.id, id));

    res.json({ success: true });
  } catch (e) {
    console.error("DELETE /products/:id error:", e);
    res.status(500).json({ error: "Failed to delete product" });
  }
});


export default router;
