const { getProducts } = require("../models/productData");
const Product = require("../models/product");
const sequelize = require("../config/database");

(async () => {
  try {
    console.log("🔄 Connecting database...");
    await sequelize.authenticate();
    console.log("✅ Database connected");

    console.log("📥 Fetching products from Google Sheet...");
    const sheetProducts = await getProducts();
    console.log("Found:", sheetProducts.length);

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
    console.error("❌ Sync failed:");
    console.error(err);
    process.exit(1);
  }
})();
