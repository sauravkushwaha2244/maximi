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
    await fs.writeFile(DATA_FILE, JSON.stringify({ expenses: [], members: [] }));
  }
};

const readData = async () => {
  await ensureDataFile();
  const data = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(data);
};

const writeData = async (data) => {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
};

router.get("/", async (req, res) => {
  try {
    const data = await readData();
    res.json(data.members || []);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch members" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, whatsappNumber } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Member name is required" });
    }

    const data = await readData();
    const members = data.members || [];

    const existingMemberIndex = members.findIndex(m => m.name.toLowerCase() === name.toLowerCase());

    if (existingMemberIndex > -1) {
      members[existingMemberIndex].whatsappNumber = whatsappNumber || "";
      members[existingMemberIndex].updatedAt = new Date().toISOString();
    } else {
      members.push({
        _id: Date.now().toString(),
        name,
        whatsappNumber: whatsappNumber || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    data.members = members;
    await writeData(data);
    res.status(201).json(members);
  } catch (error) {
    console.error("Error adding member:", error);
    res.status(500).json({ message: "Failed to add member" });
  }
});

router.put("/:name", async (req, res) => {
  try {
    const { whatsappNumber } = req.body;
    const memberName = decodeURIComponent(req.params.name);

    const data = await readData();
    const members = data.members || [];

    const member = members.find(m => m.name.toLowerCase() === memberName.toLowerCase());

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    member.whatsappNumber = whatsappNumber || "";
    member.updatedAt = new Date().toISOString();

    data.members = members;
    await writeData(data);
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: "Failed to update member" });
  }
});

router.delete("/:name", async (req, res) => {
  try {
    const memberName = decodeURIComponent(req.params.name);
    const data = await readData();
    let members = data.members || [];

    const initialLength = members.length;
    members = members.filter(m => m.name.toLowerCase() !== memberName.toLowerCase());

    if (members.length === initialLength) {
      return res.status(404).json({ message: "Member not found" });
    }

    data.members = members;
    await writeData(data);
    res.json({ message: "Member deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete member" });
  }
});

export default router;
