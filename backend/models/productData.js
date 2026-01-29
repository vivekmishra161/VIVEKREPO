const fetch = require("node-fetch");

const SHEET_ID = "1X4KhQUY-evoKQOKB1qOyX2Y1_EyAGsYU-SHaIk99wPs";
const API_KEY = "AIzaSyDfyx80D4bHDx6aD4E5gZVq5nqC0GbTjuk";

// A → G
const RANGE = "Sheet1!A2:h1000000";

function applyDiscount(price, discount) {
  const d = Number(discount);

  if (!d || isNaN(d) || d <= 0) {
    return {
      discount: 0,
      finalPrice: price
    };
  }

  const finalPrice = price - (price * d) / 100;

  return {
    discount: d,
    finalPrice: Math.round(finalPrice)
  };
}


async function getProducts() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.values) return [];

  return data.values.map(row => {
    const price = Number(row[4]) || 0;
    const discountData = applyDiscount(price, row[6] || 0);


    return {
      id: row[0]?.toString().trim(),
      manufacturer: row[1]?.trim(),
      name: row[2]?.trim(),
      category: row[3]?.trim(),
      price: Number(row[4]) || 0,
      stock: row[5] || "Out of Stock",
      discount: Number(row[6]) || 0,
      finalPrice: Number(row[4]) - (Number(row[4]) * Number(row[6]) / 100),
      image: row[7] || null
    };
  });
}

module.exports = { getProducts };
