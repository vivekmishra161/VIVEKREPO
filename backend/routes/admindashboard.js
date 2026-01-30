const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const Order = require("../models/order");

router.get("/dashboard", adminAuth, async (req, res) => {
  try {
    const totalOrders = await Order.count();

    const delivered = await Order.count({
      where: { status: "Delivered" }
    });

    const cancelled = await Order.count({
      where: { status: "Cancelled" }
    });

    const pending = await Order.count({
      where: { status: "Pending" }
    });

    const packed = await Order.count({
      where: { status: "Packed" }
    });

    const deliveredOrders = await Order.findAll({
      where: { status: "Delivered" }
    });

    const totalRevenue = deliveredOrders.reduce(
      (sum, o) => sum + o.totalPrice,
      0
    );
  // =============================
    // TOP 5 SELLING PRODUCTS
    // =============================
    const allOrders = await Order.findAll();

    const productSales = {};

    allOrders.forEach(order => {
      if (!order.items) return;

      order.items.forEach(item => {
        const name = item.name;
        const amount = Number(item.price || 0) * Number(item.qty || 1);

        if (!productSales[name]) {
          productSales[name] = 0;
        }

        productSales[name] += amount;
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([name, total]) => ({
        name,
        total
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // =============================
    // SEND TO DASHBOARD
    // =============================
    res.render("admin/dashboard", {
      totalOrders,
      delivered,
      cancelled,
      pending,
      packed,
      totalRevenue,
      topProducts   // ✅ NOW EXISTS
    });

  } catch (err) {
    console.error("Dashboard error:", err);

    res.render("admin/dashboard", {
      totalOrders: 0,
      delivered: 0,
      cancelled: 0,
      pending: 0,
      packed: 0,
      totalRevenue: 0,
      topProducts: []   // ✅ SAFE FALLBACK
    });
  }
});

module.exports = router;
