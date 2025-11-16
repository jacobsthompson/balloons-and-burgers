import express from "express";
import fetch from "node-fetch"; // Node 18+ has fetch globally; you could skip this if using Node 20
import cors from "cors";

const app = express();
const PORT = 3001;

// Enable CORS for all origins
app.use(cors());

app.get("/api/balloons/:offset", async (req, res) => {
  const offset = String(req.params.offset).padStart(2, "0");
  const url = `https://a.windbornesystems.com/treasure/${offset}.json`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error(`Failed to fetch ${offset}:`, e.message);
    res.status(500).json({ error: "Failed to fetch balloon data" });
  }
});

app.get("/", (req, res) => {
  res.send("Windborne Proxy Server running with CORS");
});

app.listen(PORT, () => console.log(`Proxy server running at http://localhost:${PORT}`));
