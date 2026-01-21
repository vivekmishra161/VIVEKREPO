const fetch = require("node-fetch");

const SHEET_ID = "1X4KhQUY-evoKQOKB1qOyX2Y1_EyAGsYU-SHaIk99wPs";
const API_KEY = "AIzaSyDfyx80D4bHDx6aD4E5gZVq5nqC0GbTjuk";

// A → F (IMPORTANT)
const RANGE = "Sheet1!A2:F109";

async function getProducts() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.values) return [];

  return data.values.map(row => ({
    id: row[0] || "",
    manufacturer: row[1] || "",
    name: row[2] || "",
    category: row[3] || "",
    price: Number(row[4]) || 0,
    stock: row[5] || "Out of Stock"
  }));
}

module.exports = { getProducts };
