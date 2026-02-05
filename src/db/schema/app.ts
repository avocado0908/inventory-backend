import { relations } from "drizzle-orm";
import { pgTable, varchar, integer, timestamp } from "drizzle-orm/pg-core";

const timestamps = {
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull()
}

export const categories = pgTable('categories', {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    name: varchar('name', {length: 255}).notNull(),
    description: varchar('description', {length: 255}),
    ...timestamps
});

export const products = pgTable('products', {
   id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
   name: varchar("name", { length: 255 }).notNull(),
   categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: 'restrict'}),
  ...timestamps,
});

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
