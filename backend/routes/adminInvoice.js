const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const path = require("path");

const Order = require("../models/order");
const adminAuth = require("../middleware/adminAuth");

router.get("/invoice/:id", adminAuth, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.send("Order not found");

    // PDF headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=AKC-INVOICE-${order.id}.pdf`
    );

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    /* ================= LOGO ================= */

    const logoPath = path.join(
      __dirname,
      "../public/images/logo.png"
    );

    doc.image(logoPath, 50, 40, { width: 70 });

    /* ================= COMPANY INFO ================= */

    doc
      .fontSize(20)
      .fillColor("#111827")
      .text("AKC AUTO PARTS", 140, 50);

    doc
      .fontSize(10)
      .fillColor("gray")
      .text("Genuine Hyundai • Tata • Bajaj Parts", 140, 75);

    doc
      .fontSize(10)
      .text("Bareilly, Uttar Pradesh, India", 140, 90);

    /* ================= TITLE ================= */

    doc
      .fontSize(28)
      .fillColor("#000")
      .text("INVOICE", 0, 140, { align: "center" });

    doc
      .moveTo(50, 175)
      .lineTo(550, 175)
      .strokeColor("#93c5fd")
      .stroke();

    /* ================= BILL TO ================= */

    let y = 200;

    doc
      .fontSize(11)
      .fillColor("#2563eb")
      .text("Bill To", 50, y);

    doc
      .fillColor("#111827")
      .fontSize(11)
      .text(order.customerName, 50, y + 18);

    doc
      .fontSize(10)
      .text(`Phone: ${order.phone}`, 50, y + 35);

    doc
      .fontSize(10)
      .text(
        `${order.address}, ${order.city}, ${order.state} - ${order.pin}`,
        50,
        y + 52,
        { width: 250 }
      );

    /* ================= META ================= */

    const rx = 360;

    doc.fontSize(10).fillColor("#111827");
    doc.text(`Invoice: AKC-${order.id}`, rx, y);
    doc.text(
      `Invoice Date: ${new Date(order.createdAt).toDateString()}`,
      rx,
      y + 18
    );

    /* ================= TABLE ================= */

    y += 110;

    doc
      .moveTo(50, y)
      .lineTo(550, y)
      .strokeColor("#93c5fd")
      .stroke();

    y += 10;

    doc
      .fontSize(11)
      .fillColor("#2563eb")
      .text("Item & Description", 50, y)
      .text("Amount", 480, y, { align: "right" });

    y += 10;

    doc
      .moveTo(50, y)
      .lineTo(550, y)
      .strokeColor("#e5e7eb")
      .stroke();

    y += 15;

    let subtotal = 0;

    order.items.forEach((item, index) => {
      const total = item.price * item.qty;
      subtotal += total;

      doc
        .fontSize(10)
        .fillColor("#111827")
        .text(`${index + 1}. ${item.name}`, 50, y);

      doc
        .fontSize(9)
        .fillColor("#6b7280")
        .text(`Qty: ${item.qty} | ID: ${item.id}`, 50, y + 14);

      doc
        .fontSize(10)
        .fillColor("#111827")
        .text(`₹ ${total.toFixed(2)}`, 480, y, { align: "right" });

      y += 38;
    });

    /* ================= TOTAL ================= */

    y += 10;

    doc
      .moveTo(350, y)
      .lineTo(550, y)
      .strokeColor("#93c5fd")
      .stroke();

    y += 15;

    doc
      .fontSize(13)
      .fillColor("#111827")
      .text(`Grand Total: ₹ ${subtotal.toFixed(2)}`, 350, y, {
        align: "right"
      });

    /* ================= FOOTER ================= */

    y += 70;

    doc
      .fontSize(9)
      .fillColor("#6b7280")
      .text(
        "This is a computer generated invoice. No signature required.",
        50,
        y,
        { align: "center", width: 500 }
      );

    y += 18;

    doc
      .fontSize(11)
      .fillColor("#111827")
      .text(
        "Thank you for shopping with AKC Auto Parts.",
        50,
        y,
        { align: "center", width: 500 }
      );

    doc.end();

  } catch (err) {
    console.error("Invoice Error:", err);
    res.status(500).send("Invoice generation failed");
  }
});

module.exports = router;
