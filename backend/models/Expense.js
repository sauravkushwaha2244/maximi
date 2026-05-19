import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 1
    },
    category: {
      type: String,
      default: "Other"
    },
    paidBy: {
      type: String,
      required: true,
      trim: true
    },
    members: {
      type: [String],
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      default: ""
    },
    settled: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);
