import express from 'express';
import subjectsRouter from './routes/products';
import cors from "cors";

const app = express();
const PORT = 8000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL, // React app URL
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
    credentials: true, // allow cookies
  })
);

app.use(express.json());
app.use('/api/products', subjectsRouter)

app.get ('/', (req, res) => {
    res.send('Hello, welcome to the Stocktake API');
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});