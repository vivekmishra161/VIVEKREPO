const express = require("express");
const router = express.Router();

const { getProducts } = require("../models/productData");
const Product = require("../models/product");

router.get("/sync-products", async (req, res) => {
  try {
    const products = await getProducts();

    let created = 0;
    let updated = 0;

    for (const p of products) {
      const existing = await Product.findOne({
        where: { part_no: p.id }
      });

      if (existing) {
        await existing.update({
          name: p.name,
          category: p.category,
          price: p.price,
          discount: p.discount,
          final_price: p.finalPrice,
          stock: p.stock
        });
        updated++;
      } else {
        await Product.create({
          part_no: p.id,
          name: p.name,
          category: p.category,
          price: p.price,
          discount: p.discount,
          final_price: p.finalPrice,
          stock: p.stock
        });
        created++;
      }
    }

    res.json({
      success: true,
      created,
      updated,
      total: products.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
