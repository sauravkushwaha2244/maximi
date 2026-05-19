import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "../data.json");

const ensureDataFile = async () => {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ expenses: [] }));
  }
};

const readExpenses = async () => {
  await ensureDataFile();
  const data = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(data).expenses || [];
};

const writeExpenses = async (expenses) => {
  await fs.writeFile(DATA_FILE, JSON.stringify({ expenses }, null, 2));
};

router.get("/", async (req, res) => {
  try {
    const expenses = await readExpenses();
    res.json(expenses.sort((a, b) => new Date(b.date) - new Date(a.date)));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch expenses" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, amount, category, paidBy, members, date, notes } = req.body;

    if (!title || !amount || !paidBy || !members || members.length === 0) {
      return res.status(400).json({ message: "Title, amount, paidBy, and members are required" });
    }

    const expenses = await readExpenses();
    
    const newExpense = {
      _id: Date.now().toString(),
      title,
      amount: Number(amount),
      category: category || "Other",
      paidBy,
      members: Array.isArray(members) ? members : members.split(",").map(m => m.trim()),
      date: date || new Date().toISOString(),
      notes: notes || "",
      settled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    expenses.push(newExpense);
    await writeExpenses(expenses);
    
    res.status(201).json(newExpense);
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ message: "Failed to add expense" });
  }
});

router.patch("/:id/settle", async (req, res) => {
  try {
    const expenses = await readExpenses();
    const expense = expenses.find(e => e._id === req.params.id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    expense.settled = true;
    expense.updatedAt = new Date().toISOString();
    
    await writeExpenses(expenses);
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: "Failed to settle expense" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    let expenses = await readExpenses();
    const initialLength = expenses.length;
    
    expenses = expenses.filter(e => e._id !== req.params.id);

    if (expenses.length === initialLength) {
      return res.status(404).json({ message: "Expense not found" });
    }

    await writeExpenses(expenses);
    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete expense" });
  }
});

export default router;
