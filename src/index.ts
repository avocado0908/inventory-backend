import express from 'express';
import subjectsRouter from './routes/products';
import suppliersRouter from "./routes/suppliers";
import categoriesRouter from "./routes/categories";
import uomRouter from "./routes/uom";
import cors from "cors";

const app = express();
const PORT = 8000;

if (!process.env.FRONTEND_URL) {
  console.warn('Warning: FRONTEND_URL is not set. CORS will be restrictive.');
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL || false, // Disable CORS if not configured
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
    credentials: true, // allow cookies
  })
);

app.use(express.json());
app.use('/api/products', subjectsRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/suppliers', suppliersRouter)
app.use('/api/uom', uomRouter)

app.get ('/', (req, res) => {
    res.send('Hello, welcome to the Stocktake API');
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});