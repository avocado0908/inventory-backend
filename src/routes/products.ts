import { eq, ilike, or, and, desc, sql, getTableColumns } from "drizzle-orm"
import express from "express";
import { products, categories, suppliers, uom } from "../db/schema";
import { db } from "../db";

const router = express.Router();

router.get('/', async (req, res) => {
    try{
        const { search, category, page, limit } = req.query;

        const currentPage = Math.max(1, Number(page) || 1);
        const limitPerPage = Math.max(1, Math.min(100, Number(limit) || 10));

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        //If search query exists, filter by product name
        if(search) {
            filterConditions.push(
                    ilike(products.name , `%${search}%`),                
            )
        }

        //If category filter exists, match category name
        if (category) {
            filterConditions.push(ilike(categories.name,`%${category}%`));
        }
        
        //Combine all filters using AND if any exists
        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        // Count total for pagination
        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .leftJoin(categories, eq(products.categoryId, categories.id))
            .where(whereClause);

        const totalCount = countResult[0] ?.count ?? 0;

        // Get product list including category, supplier, and uom
        const productsList = await db
        .select({
                ...getTableColumns(products),
                category: { ...getTableColumns(categories) },
                supplier: { ...getTableColumns(suppliers) }, // include supplier
                uom: { ...getTableColumns(uom) }, // include uom
            })
            .from(products)
            .leftJoin(categories, eq(products.categoryId, categories.id))
            .leftJoin(suppliers, eq(products.supplierId, suppliers.id)) // join supplier
            .leftJoin(uom, eq(products.uomId, uom.id)) // join uom
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

    }catch (e) {
        console.error(`GET /products error: ${e}`);
        res.status(500).json({ error: 'Failed to get products' });
    }
});

/* =========================
   POST /products (create)
========================= */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      categoryId,
      supplierId,
      uomId,
      pkg,
      barcode,
    } = req.body;

    const categoryIdNum = Number(categoryId);
    const supplierIdNum = Number(supplierId);
    const uomIdNum = Number(uomId);
    const pkgNum = Number(pkg);

    if (
      !name ||
      !Number.isInteger(categoryIdNum) || categoryIdNum <= 0 ||
      !Number.isInteger(supplierIdNum) || supplierIdNum <= 0 ||
      !Number.isInteger(uomIdNum) || uomIdNum <= 0 ||
      !Number.isInteger(pkgNum) || pkgNum <= 0
    ) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const [createdProduct] = await db
      .insert(products)
      .values({
        name: String(name),
        categoryId: categoryIdNum,
        supplierId: supplierIdNum,
        uomId: uomIdNum,
        pkg: pkgNum,
        barcode: barcode ?? null,
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


/* =========================
   PUT /products/:id (update)
========================= */
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const {
      name,
      categoryId,
      supplierId,
      uomId,
      pkg,
      barcode,
    } = req.body;

    const updated = await db
      .update(products)
      .set({
        name,
        categoryId,
        supplierId,
        uomId,
        pkg,
        barcode,
      })
      .where(eq(products.id, id))
      .returning({ id: products.id });

    if (updated.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ success: true });
  } catch (e) {
    console.error("PUT /products/:id error:", e);
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