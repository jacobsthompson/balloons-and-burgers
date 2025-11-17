import fetch from "node-fetch";

export default async function handler(req, res) {
  const { offset } = req.query;
  const url = `https://a.windbornesystems.com/treasure/${String(offset).padStart(2, "0")}.json`;

  try {
    const response = await fetch(url);
    const json = await response.json();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*"); // CORS
    return res.status(200).json(json);
  } catch (e) {
    return res.status(500).json({ error: "Failed to fetch data" });
  }
}
