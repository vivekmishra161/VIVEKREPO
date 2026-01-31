const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const Order = require("../models/order");
const adminAuth = require("../middleware/adminAuth");

router.get("/invoice/:id", adminAuth, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).send("Order not found");
    }

    // Set headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order.id}.pdf`
    );

    const doc = new PDFDocument({ margin: 50 });

    doc.pipe(res);

    // ===== HEADER =====
    doc
      .fontSize(22)
      .text("AKC AUTO PARTS", { align: "center" })
      .moveDown(0.5);

    doc
      .fontSize(12)
      .text("GST Invoice", { align: "center" })
      .moveDown(1);

    // ===== CUSTOMER =====
    doc.fontSize(12).text(`Invoice No: AKC-${order.id}`);
    doc.text(`Date: ${new Date(order.createdAt).toDateString()}`);
    doc.moveDown();

    doc.text(`Customer: ${order.customerName}`);
    doc.text(`Phone: ${order.phone || "N/A"}`);
    doc.text(
      `Address: ${order.address}, ${order.city}, ${order.state} - ${order.pin}`
    );

    doc.moveDown();

    // ===== ITEMS =====
    doc.fontSize(14).text("Products");
    doc.moveDown(0.5);

    order.items.forEach((item, index) => {
      doc
        .fontSize(11)
        .text(
          `${index + 1}. ${item.name} (${item.id})  x${item.qty}  ₹${item.price}`
        );
    });

    doc.moveDown();

    // ===== TOTAL =====
    doc
      .fontSize(14)
      .text(`Total Amount: ₹${Number(order.totalPrice).toFixed(2)}`, {
        align: "right",
      });

    doc.moveDown(2);

    doc
      .fontSize(10)
      .text("Thank you for shopping with AKC Auto Parts.", {
        align: "center",
      });

    doc.end();

  } catch (err) {
    console.error("Invoice error:", err);
    res.status(500).send("Invoice generation failed");
  }
});

module.exports = router;
