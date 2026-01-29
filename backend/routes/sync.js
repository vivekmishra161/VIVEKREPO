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

      // ❗ VERY IMPORTANT
      if (!p.id) continue;

      const [row, isCreated] = await Product.upsert(
        {
          part_no: p.id,
          name: p.name,
          category: p.category,
          manufacturer: p.manufacturer || "Hyundai",
          price: p.price,
          discount: p.discount,
          final_price: p.finalPrice,
          stock: p.stock,
          image: p.image
        },
        { returning: true }
      );

      if (isCreated) created++;
      else updated++;
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
