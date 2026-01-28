const express = require("express");
const router = express.Router();

const { getProducts } = require("../models/productData");
const Product = require("../models/product");

router.get("/sync-products", async (req, res) => {
  try {
    const products = await getProducts();

    let count = 0;

    for (const p of products) {
      await Product.upsert({
        part_no: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        discount: p.discount,
        final_price: p.finalPrice,
        stock: p.stock
      });
      count++;
    }

    res.json({
      success: true,
      synced: count
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
