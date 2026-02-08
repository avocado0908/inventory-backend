DO $$
BEGIN
  CREATE TYPE "branch_assignment_status" AS ENUM ('not started', 'in progress', 'done');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "branch_assignments"
  ADD COLUMN IF NOT EXISTS "status" "branch_assignment_status" NOT NULL DEFAULT 'not started',
  ADD COLUMN IF NOT EXISTS "created_at" timestamp NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
