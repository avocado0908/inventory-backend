import express from "express";
import cors from "cors";
import productsRouter from "./routes/products";
import suppliersRouter from "./routes/suppliers";
import categoriesRouter from "./routes/categories";
import uomRouter from "./routes/uom";
import branchesRouter from "./routes/branches";
import monthlyInventoryRouter from "./routes/monthly-inventory";
import branchAssignmentsRouter from "./routes/branch-assignments";
import stocktakeSummariesRouter from "./routes/stocktake-summaries";

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL ?? "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  console.warn("Warning: FRONTEND_URL is not set. CORS will block browser requests.");
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/suppliers", suppliersRouter);
app.use("/api/uom", uomRouter);
app.use("/api/branches", branchesRouter);
app.use("/api/monthly-inventory", monthlyInventoryRouter);
app.use("/api/branch-assignments", branchAssignmentsRouter);
app.use("/api/stocktake-summaries", stocktakeSummariesRouter);

app.get("/", (_req, res) => {
  res.send("Hello, welcome to the Stocktake API");
});

export default app;
