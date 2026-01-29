const express = require("express");
const router = express.Router();

const { getProducts } = require("../models/productData");
const Product = require("../models/product");

router.get("/sync-products", async (req, res) => {
  try {
    const products = await getProducts();

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const p of products) {

      // 🔴 skip only if part number missing
      if (!p.id) {
        skipped++;
        continue;
      }

      const payload = {
        part_no: String(p.id).replace(/\.0$/, "").trim(),
        manufacturer: p.manufacturer || "Hyundai",
        name: p.name || "",
        category: p.category || "",
        price: Number(p.price) || 0,
        discount: Number(p.discount) || 0,
        final_price:
          Number(p.price || 0) -
          (Number(p.price || 0) * Number(p.discount || 0)) / 100,
        stock: p.stock || "In Stock",
        image: p.image || null
      };

      const existing = await Product.findOne({
        where: { part_no: payload.part_no }
      });

      if (existing) {
        await existing.update(payload);
        updated++;
      } else {
        await Product.create(payload);
        created++;
      }
    }

    res.json({
      success: true,
      created,
      updated,
      skipped,
      total_from_sheet: products.length
    });

  } catch (err) {
    console.error("SYNC ERROR:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
module.exports = router;