const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Отдаём статику (index.html, style.css, app.js и т.п.)
app.use(express.static(__dirname));

// Прокси до MOEX для обхода CORS
app.get("/api/ofz", async (req, res) => {
  const url =
    "https://iss.moex.com/iss/engines/stock/markets/bonds/boards/TQOB/securities.json?iss.meta=off";

  try {
    const moexRes = await fetch(url);

    if (!moexRes.ok) {
      return res.status(moexRes.status).json({ error: "MOEX error" });
    }

    const text = await moexRes.text();
    res.set("Content-Type", moexRes.headers.get("content-type") || "application/json");
    res.send(text);
  } catch (e) {
    console.error("Proxy error:", e);
    res.status(500).json({ error: "Failed to fetch from MOEX" });
  }
});

app.listen(PORT, () => {
  console.log(`OFZ app is running on http://localhost:${PORT}`);
});

