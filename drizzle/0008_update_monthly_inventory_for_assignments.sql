ALTER TABLE "monthly_inventory"
  DROP COLUMN IF EXISTS "branch_id",
  DROP COLUMN IF EXISTS "month",
  ADD COLUMN IF NOT EXISTS "branch_assignments_id" integer NOT NULL REFERENCES "branch_assignments"("id") ON DELETE restrict ON UPDATE no action;

CREATE UNIQUE INDEX IF NOT EXISTS "monthly_inventory_assignment_product_idx"
ON "monthly_inventory" ("branch_assignments_id", "product_id");
