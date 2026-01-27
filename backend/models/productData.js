const fetch = require("node-fetch");

const SHEET_ID = "1X4KhQUY-evoKQOKB1qOyX2Y1_EyAGsYU-SHaIk99wPs";
const API_KEY = "AIzaSyDfyx80D4bHDx6aD4E5gZVq5nqC0GbTjuk";

// A → G
const RANGE = "Sheet1!A2:G109";

function applyDiscount(price, discount) {
  discount = Number(discount || 0);

  if (discount > 0) {
    const discountAmount = (price * discount) / 100;
    const finalPrice = price - discountAmount;

    return {
      discount,
      finalPrice: Math.round(finalPrice)
    };
  }

  return {
    discount: 0,
    finalPrice: price
  };
}

async function getProducts() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.values) return [];

  return data.values.map(row => {
    const price = Number(row[4]) || 0;
    const discountData = applyDiscount(price, row[6]);

    return {
      id: row[0] || "",
      manufacturer: row[1] || "",
      name: row[2] || "",
      category: row[3] || "",
      price: price,
      discount: discountData.discount,
      finalPrice: discountData.finalPrice,
      stock: row[5] || "Out of Stock"
    };
  });
}

module.exports = { getProducts };
