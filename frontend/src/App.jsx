import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

// API configuration - use environment variable or fallback to proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const categories = ["Rent", "Electricity", "Grocery", "WiFi", "Water", "Food", "Cleaning", "Travel", "Other"];

function App() {
  const [expenses, setExpenses] = useState([]);
  const [membersText, setMembersText] = useState("");
  const [membersList, setMembersList] = useState([]);
  const [whatsappInput, setWhatsappInput] = useState("");
  const [selectedMemberForWhatsapp, setSelectedMemberForWhatsapp] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [remindersSent, setRemindersSent] = useState(0);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food",
    paidBy: "",
    members: "",
    date: new Date().toISOString().slice(0, 10),
    notes: ""
  });

  const members = useMemo(() => {
    return membersText
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
  }, [membersText]);

  const fetchExpenses = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/expenses`);
      const data = await res.json();
      setExpenses(data);
    } catch {
      console.log("Backend not connected");
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/members`);
      const data = await res.json();
      setMembersList(data);
    } catch {
      console.log("Failed to fetch members");
    }
  };

  const saveWhatsappNumber = async (memberName, whatsappNumber) => {
    try {
      const res = await fetch(`${API_BASE_URL}/members/${encodeURIComponent(memberName)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappNumber })
      });
      if (res.ok) {
        fetchMembers();
        setWhatsappInput("");
        setSelectedMemberForWhatsapp("");
      }
    } catch (error) {
      console.error("Error saving WhatsApp number:", error);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchMembers();
  }, []);

  const addExpense = async (e) => {
    e.preventDefault();

    const selectedMembers = form.members
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);

    if (!form.title || !form.amount || selectedMembers.length === 0) {
      alert("Please fill in all required fields and select members");
      return;
    }

    const payload = {
      ...form,
      amount: Number(form.amount),
      members: selectedMembers
    };

    try {
      const res = await fetch(`${API_BASE_URL}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setForm({
          title: "",
          amount: "",
          category: "Food",
          paidBy: form.paidBy,
          members: membersText,
          date: new Date().toISOString().slice(0, 10),
          notes: ""
        });
        fetchExpenses();
        alert("Expense added successfully!");
      } else {
        const error = await res.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      alert("Failed to add expense. Make sure the backend is running.");
      console.error(error);
    }
  };

  const deleteExpense = async (id) => {
    await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: "DELETE"
    });
    fetchExpenses();
  };

  const settleExpense = async (id) => {
    await fetch(`${API_BASE_URL}/expenses/${id}/settle`, {
      method: "PATCH"
    });
    fetchExpenses();
  };

  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const categoryData = categories
    .map((cat) => ({
      name: cat,
      value: expenses
        .filter((exp) => exp.category === cat)
        .reduce((sum, exp) => sum + exp.amount, 0)
    }))
    .filter((item) => item.value > 0);

  const memberSpendData = members.map((member) => ({
    name: member,
    paid: expenses
      .filter((exp) => exp.paidBy === member)
      .reduce((sum, exp) => sum + exp.amount, 0)
  }));

  const balances = useMemo(() => {
    const result = {};
    members.forEach((member) => {
      result[member] = 0;
    });

    expenses
      .filter((exp) => !exp.settled)
      .forEach((exp) => {
        const share = exp.amount / exp.members.length;

        exp.members.forEach((member) => {
          result[member] -= share;
        });

        result[exp.paidBy] += exp.amount;
      });

    return Object.entries(result).map(([name, balance]) => ({
      name,
      balance: Number(balance.toFixed(2))
    }));
  }, [expenses, members]);

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("FlatMate Monthly Expense Report", 15, 20);

    doc.setFontSize(12);
    doc.text(`Total Expense: Rs. ${totalExpense}`, 15, 35);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 15, 45);

    let y = 60;

    doc.text("Expenses:", 15, y);
    y += 10;

    expenses.forEach((exp, index) => {
      const line = `${index + 1}. ${exp.title} - Rs. ${exp.amount} - Paid by ${exp.paidBy}`;
      doc.text(line.slice(0, 85), 15, y);
      y += 8;

      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    y += 10;
    doc.text("Balances:", 15, y);
    y += 10;

    balances.forEach((b) => {
      const status = b.balance > 0 ? "gets back" : b.balance < 0 ? "owes" : "settled";
      doc.text(`${b.name}: ${status} Rs. ${Math.abs(b.balance)}`, 15, y);
      y += 8;
    });

    doc.save("flat-expense-report.pdf");
  };

  const makeWhatsappReminder = (member, amount) => {
    const formattedAmount = Math.abs(amount).toFixed(2);
    const text = `👋 Hey ${member}!\n\n💰 Expense Reminder:\nYou owe ₹${formattedAmount} for this month's flat expenses.\n\n📋 Please settle this ASAP to keep things smooth!\n\nThanks! 🙏`;
    
    const memberData = membersList.find(m => m.name.toLowerCase() === member.toLowerCase());
    if (memberData && memberData.whatsappNumber) {
      return `https://wa.me/${memberData.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
    }
    
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const sendAllReminders = async () => {
    const debtors = balances.filter(b => b.balance < 0);
    if (debtors.length === 0) {
      alert("🎉 No one owes money! Everyone is settled");
      return;
    }
    
    setIsSending(true);
    setRemindersSent(0);
    
    for (let index = 0; index < debtors.length; index++) {
      const debtor = debtors[index];
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const url = makeWhatsappReminder(debtor.name, debtor.balance);
      window.open(url, '_blank');
      
      setRemindersSent(index + 1);
    }
    
    setIsSending(false);
    
    setTimeout(() => {
      setRemindersSent(0);
    }, 3000);
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>FlatMate</h1>
        <p>Expense Splitter</p>

        <div className="stat">
          <span>Total Expense</span>
          <b>₹{totalExpense.toFixed(2)}</b>
        </div>

        <button onClick={downloadPDF}>📄 Download PDF Report</button>
        <button 
          onClick={sendAllReminders} 
          disabled={isSending}
          style={{ 
            marginTop: "10px", 
            background: isSending ? "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            opacity: isSending ? 0.7 : 1,
            cursor: isSending ? "not-allowed" : "pointer",
            transition: "all 0.3s ease"
          }}
        >
          {isSending ? `💬 Sending... (${remindersSent}/${balances.filter(b => b.balance < 0).length})` : "💬 Send All WhatsApp Reminders"}
        </button>
      </aside>

      <main className="main">
        <section className="top-grid">
          <div className="card">
            <h2>Add Flatmates</h2>
            <label>Members separated by comma</label>
            <input
              value={membersText}
              onChange={(e) => {
                setMembersText(e.target.value);
                setForm({ ...form, members: e.target.value });
              }}
              placeholder="e.g., Saurav, Rahul, Aman"
            />
          </div>

          <div className="card">
            <h2>📱 WhatsApp Numbers</h2>
            <select
              value={selectedMemberForWhatsapp}
              onChange={(e) => setSelectedMemberForWhatsapp(e.target.value)}
              style={{ marginBottom: "10px" }}
            >
              <option value="">Select a member</option>
              {members.map((member) => (
                <option key={member} value={member}>
                  {member}
                </option>
              ))}
            </select>
            <input
              type="tel"
              placeholder="WhatsApp number (e.g., +91XXXXXXXXXX)"
              value={whatsappInput}
              onChange={(e) => setWhatsappInput(e.target.value)}
              style={{ marginBottom: "10px" }}
            />
            <button
              type="button"
              onClick={() => {
                if (selectedMemberForWhatsapp && whatsappInput) {
                  saveWhatsappNumber(selectedMemberForWhatsapp, whatsappInput);
                }
              }}
              style={{ width: "100%" }}
            >
              Save WhatsApp Number
            </button>
            {membersList.length > 0 && (
              <div style={{ marginTop: "15px", fontSize: "13px" }}>
                {membersList.map((m) => (
                  <div key={m._id} style={{ padding: "8px", background: "#f3f4f6", borderRadius: "8px", marginBottom: "8px" }}>
                    <strong>{m.name}</strong>: {m.whatsappNumber || "No number"}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="top-grid" style={{ gridTemplateColumns: "1fr 2fr", marginBottom: "20px" }}>
          <form className="card form-card" onSubmit={addExpense}>
            <h2>Add Expense</h2>

            <input
              placeholder="Expense title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />

            <input
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />

            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {categories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={form.paidBy}
              onChange={(e) => setForm({ ...form, paidBy: e.target.value })}
            >
              <option value="">Select who paid</option>
              {members.map((member) => (
                <option key={member}>{member}</option>
              ))}
            </select>

            <input
              value={form.members}
              onChange={(e) => setForm({ ...form, members: e.target.value })}
              placeholder="Split between members"
            />

            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />

            <textarea
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />

            <button type="submit">Add Expense</button>
          </form>
        </section>

        <section className="chart-grid">
          <div className="card chart-card">
            <h2>Category Spending</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {categoryData.map((_, index) => (
                    <Cell key={index} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card chart-card">
            <h2>Member Spending</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={memberSpendData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="paid" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bottom-grid">
          <div className="card">
            <h2>💰 Balances & Reminders</h2>
            {balances.map((b) => (
              <div className="balance-row" key={b.name}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "16px", fontWeight: "600" }}>{b.name}</span>
                </div>
                <b className={b.balance >= 0 ? "positive" : "negative"} style={{ fontSize: "16px", minWidth: "140px", textAlign: "right" }}>
                  {b.balance > 0 && `✅ Gets ₹${b.balance.toFixed(2)}`}
                  {b.balance < 0 && `⚠️ Owes ₹${Math.abs(b.balance).toFixed(2)}`}
                  {b.balance === 0 && "✅ Settled"}
                </b>

                {b.balance < 0 && (
                  <a 
                    href={makeWhatsappReminder(b.name, b.balance)} 
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      marginLeft: "10px",
                      padding: "8px 12px",
                      background: "#25d366",
                      color: "white",
                      borderRadius: "8px",
                      textDecoration: "none",
                      fontSize: "13px",
                      fontWeight: "600",
                      transition: "all 0.3s ease",
                      whiteSpace: "nowrap"
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = "#1fa857";
                      e.target.style.transform = "scale(1.05)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = "#25d366";
                      e.target.style.transform = "scale(1)";
                    }}
                  >
                    💬 Remind
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="card">
            <h2>Recent Expenses</h2>
            <div className="expense-list">
              {expenses.map((exp) => (
                <div className="expense-item" key={exp._id}>
                  <div>
                    <h3>{exp.title}</h3>
                    <p>
                      ₹{exp.amount} • {exp.category} • Paid by {exp.paidBy}
                    </p>
                    <small>
                      Split: {exp.members.join(", ")} {exp.settled && "• Settled"}
                    </small>
                  </div>

                  <div className="actions">
                    {!exp.settled && (
                      <button onClick={() => settleExpense(exp._id)}>Settle</button>
                    )}
                    <button className="danger" onClick={() => deleteExpense(exp._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {expenses.length === 0 && <p>No expenses added yet.</p>}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
