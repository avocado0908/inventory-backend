import { relations } from "drizzle-orm";
import {
  pgTable,
  varchar,
  integer,
  numeric,
  timestamp,
  date,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};

export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }),
  ...timestamps,
});

export const products = pgTable("products", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  supplierId: integer("supplier_id")
    .notNull()
    .references(() => suppliers.id, { onDelete: "restrict" }),
  uomId: integer("uom_id")
    .notNull()
    .references(() => uom.id, { onDelete: "restrict" }),
  price: numeric("price", { precision: 12, scale: 2 }),
  pkg: integer("pkg").notNull(),
  barcode: varchar("barcode", { length: 255 }),
  ...timestamps,
});

export const suppliers = pgTable("suppliers", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 255 }),
  ...timestamps,
});

export const uom = pgTable("uom", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }),
  ...timestamps,
});

export const branches = pgTable("branches", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  ...timestamps,
});

export const monthlyInventory = pgTable("monthly_inventory", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  branchAssignmentsId: integer("branch_assignments_id")
    .notNull()
    .references(() => branchAssignments.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  stockValue: numeric("stock_value", { precision: 12, scale: 2 }),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const branchAssignmentStatus = pgEnum("branch_assignment_status", [
  "not started",
  "in progress",
  "done",
]);

export const branchAssignments = pgTable("branch_assignments", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  assignedMonth: date("assigned_month").notNull(),
  branchId: integer("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "restrict" })
    .unique(),
  status: branchAssignmentStatus("status").notNull().default("in progress"),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const stocktakeSummaries = pgTable("stocktake_summaries", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  branchAssignmentId: integer("branch_assignment_id")
    .notNull()
    .references(() => branchAssignments.id, { onDelete: "cascade" })
    .unique(),
  grandTotal: numeric("grand_total", { precision: 12, scale: 2 }).notNull(),
  totalsByCategory: jsonb("totals_by_category").notNull(),
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

export const branchesRelations = relations(branches, ({ many }) => ({
  branchAssignments: many(branchAssignments),
}));

export const monthlyInventoryRelations = relations(
  monthlyInventory,
  ({ one }) => ({
    product: one(products, {
      fields: [monthlyInventory.productId],
      references: [products.id],
    }),
    branchAssignment: one(branchAssignments, {
      fields: [monthlyInventory.branchAssignmentsId],
      references: [branchAssignments.id],
    }),
  }),
);

export const branchAssignmentsRelations = relations(
  branchAssignments,
  ({ one }) => ({
    branch: one(branches, {
      fields: [branchAssignments.branchId],
      references: [branches.id],
    }),
  }),
);

export const stocktakeSummariesRelations = relations(
  stocktakeSummaries,
  ({ one }) => ({
    branchAssignment: one(branchAssignments, {
      fields: [stocktakeSummaries.branchAssignmentId],
      references: [branchAssignments.id],
    }),
  }),
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;

export type Uom = typeof uom.$inferSelect;
export type NewUom = typeof uom.$inferInsert;

export type Branch = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;

export type MonthlyInventory = typeof monthlyInventory.$inferSelect;
export type NewMonthlyInventory = typeof monthlyInventory.$inferInsert;

export type BranchAssignments = typeof branchAssignments.$inferSelect;
export type NewBranchAssignments = typeof branchAssignments.$inferInsert;

export type StocktakeSummary = typeof stocktakeSummaries.$inferSelect;
export type NewStocktakeSummary = typeof stocktakeSummaries.$inferInsert;
