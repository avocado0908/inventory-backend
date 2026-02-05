import { eq, ilike, or, and, desc, sql, getTableColumns } from "drizzle-orm"
import express from "express";
import { products, categories } from "../db/schema";
import { db } from "../db";

const router = express.Router();

router.get('/', async (req, res) => {
    try{
        const { search, category, page =1, limit =10 } = req.query;

        const currentPage = Math.max(1, +page);
        const limitPerPage = Math.max(1, +limit)

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

        
        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .leftJoin(categories, eq(products.categoryId, categories.id))
            .where(whereClause);

        const totalCount = countResult[0] ?.count ?? 0;

        const productsList = await db
        .select({ 
            ...getTableColumns(products), 
            category: { ...getTableColumns(categories)}
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(whereClause).orderBy(desc(products.createdAt))
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
        res.status(500).json({ error: 'Failed to get subjects' });
    }
})

export default router;