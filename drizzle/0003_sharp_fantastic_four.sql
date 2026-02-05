ALTER TABLE "products" DROP CONSTRAINT "products_supplier_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_uom_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_uom_id_uom_id_fk" FOREIGN KEY ("uom_id") REFERENCES "public"."uom"("id") ON DELETE restrict ON UPDATE no action;