import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import expenseRoutes from "./routes/expenses.js";
import memberRoutes from "./routes/members.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Flat Expense Backend is running" });
});

app.use("/api/expenses", expenseRoutes);
app.use("/api/members", memberRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Using file-based storage (no database required)`);
});
