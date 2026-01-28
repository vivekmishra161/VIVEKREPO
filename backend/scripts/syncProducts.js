const { getProducts } = require("../models/productData");
const Product = require("../models/product");

(async () => {
  try {
    const sheetProducts = await getProducts();

    for (const p of sheetProducts) {
      await Product.upsert({
        part_no: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        discount: p.discount,
        final_price: p.finalPrice,
        stock: p.stock
      });
    }

    console.log("✅ Products synced successfully");
    process.exit();

  } catch (err) {
    console.error("❌ Sync failed:", err);
    process.exit(1);
  }
})();
