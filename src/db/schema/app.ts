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
   supplierId: integer("supplier_id").notNull().references(() => suppliers.id, { onDelete: 'restrict'}),
  uomId: integer("uom_id").notNull().references(() => uom.id, { onDelete: 'restrict'}),
   pkg: integer("pkg").notNull(),
   barcode: varchar("barcode", { length: 255 }),
  ...timestamps,
});

export const suppliers = pgTable('suppliers', {
   id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
   name: varchar("name", { length: 255 }).notNull(),
   contactInfo: varchar("contact_info", { length: 255 }),
  ...timestamps,
});

export const uom = pgTable('uom', {
   id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
   name: varchar("name", { length: 255 }).notNull(),
   description: varchar('description', {length: 255}),
  ...timestamps,
});



export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),

  supplier: one(suppliers, {
    fields: [products.supplierId],
    references: [suppliers.id],
  }),

  uom: one(uom, {
    fields: [products.uomId],
    references: [uom.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  products: many(products),
}));

export const uomRelations = relations(uom, ({ many }) => ({
  products: many(products),
}));

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;

export type Uom = typeof uom.$inferSelect;
export type NewUom = typeof uom.$inferInsert;