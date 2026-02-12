import express from "express";
import { db } from "../db";
import { branchAssignments } from "../db/schema";
import { eq, sql } from "drizzle-orm";

const router = express.Router();

function normalizeMonth(input: string) {
  if (!input) return null;
  if (/^\d{4}-\d{2}$/.test(input)) return `${input}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  return null;
}

// GET /branch-assignments
router.get("/", async (req, res) => {
  try {
    const list = await db
      .select()
      .from(branchAssignments)
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
    console.error("GET /branch-assignments error:", error);
    res.status(500).json({ error: "Failed to fetch branch assignments" });
  }
});

/* =========================
   POST /branch-assignments (create)
========================= */
router.post("/", async (req, res) => {
  try {
    const { name, branchId, assignedMonth } = req.body;
    const normalizedMonth = normalizeMonth(String(assignedMonth ?? ""));

    if (!name || !branchId || !normalizedMonth) {
      return res.status(400).json({
        error: "name, branchId, and assignedMonth are required",
      });
    }

    const [created] = await db
      .insert(branchAssignments)
      .values({
        name: String(name),
        branchId: Number(branchId),
        assignedMonth: normalizedMonth,
      })
      .returning();

    res.status(201).json({ data: created });
  } catch (error) {
    console.error("POST /branch-assignments error:", error);
    const dbError = error as { code?: string; constraint?: string };
    if (dbError?.code === "23505") {
      const message =
        dbError.constraint === "unique_branch_month"
          ? "Branch assignment already exists for this month."
          : "Branch assignment already exists.";
      return res.status(500).json({ error: message });
    }
    res.status(500).json({ error: "Failed to create branch assignment" });
  }
});

/* =========================
   PATCH /branch-assignments/:id (update)
========================= */
router.patch("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, branchId, assignedMonth, status } = req.body;

    const updateData: Partial<typeof branchAssignments.$inferInsert> = {};
    if (name !== undefined) updateData.name = name;
    if (branchId !== undefined) updateData.branchId = Number(branchId);
    if (assignedMonth !== undefined) {
      const normalizedMonth = normalizeMonth(String(assignedMonth));
      if (normalizedMonth) {
        updateData.assignedMonth = normalizedMonth;
      }
    }
    if (status !== undefined) {
      const allowedStatus = ["not started", "in progress", "done"] as const;
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      updateData.status = status;
    }

    if (!Object.keys(updateData).length) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const [updated] = await db
      .update(branchAssignments)
      .set(updateData)
      .where(eq(branchAssignments.id, id))
      .returning();

    res.status(200).json({ data: updated });
  } catch (error) {
    console.error("PATCH /branch-assignments/:id error:", error);
    res.status(500).json({ error: "Failed to update branch assignment" });
  }
});

/* =========================
   DELETE /branch-assignments/:id
========================= */
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(branchAssignments).where(eq(branchAssignments.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE /branch-assignments/:id error:", error);
    res.status(500).json({ error: "Failed to delete branch assignment" });
  }
});

export default router;
