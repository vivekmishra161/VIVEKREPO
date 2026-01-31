const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const Order = require("../models/order");
const adminAuth = require("../middleware/adminAuth");

router.get("/invoice/:id", adminAuth, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.send("Order not found");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=AKC-INVOICE-${order.id}.pdf`
    );

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    let y = 50; // master Y pointer

    /* ================= HEADER ================= */

    doc.fontSize(22).text("AKC AUTO PARTS", 50, y);
    y += 28;

    doc.fontSize(11).text("GST INVOICE", 50, y);
    y += 25;

    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 15;

    /* ================= LEFT INFO ================= */

    doc.fontSize(11);
    doc.text(`Name: ${order.customerName}`, 50, y);
    y += 18;

    doc.text(`Phone: ${order.phone || "-"}`, 50, y);
    y += 18;

    doc.text(
      `Address: ${order.address}, ${order.city}, ${order.state} - ${order.pin}`,
      50,
      y,
      { width: 300 }
    );

    /* ================= RIGHT INFO ================= */

    const rightX = 360;
    let ry = 110;

    doc.text(`Invoice No: AKC-${order.id}`, rightX, ry);
    ry += 18;

    doc.text(
      `Date: ${new Date(order.createdAt).toDateString()}`,
      rightX,
      ry
    );

    y = Math.max(y + 45, ry + 30);

    /* ================= TABLE HEADER ================= */

    doc
      .rect(50, y, 500, 30)
      .fill("#1f2937");

    doc
      .fillColor("#ffffff")
      .fontSize(11)
      .text("No", 60, y + 8)
      .text("Product", 100, y + 8)
      .text("Qty", 380, y + 8)
      .text("Price", 430, y + 8)
      .text("Total", 500, y + 8, { align: "right" });

    doc.fillColor("#000");
    y += 40;

    /* ================= ITEMS ================= */

    let grandTotal = 0;

    order.items.forEach((item, index) => {
      const total = item.price * item.qty;
      grandTotal += total;

      doc
        .fontSize(10)
        .text(index + 1, 60, y)
        .text(`${item.name} (${item.id})`, 100, y, { width: 260 })
        .text(item.qty, 380, y)
        .text(`₹${item.price}`, 430, y)
        .text(`₹${total.toFixed(2)}`, 500, y, { align: "right" });

      y += 22;
    });

    y += 10;

    /* ================= GRAND TOTAL ================= */

    doc.moveTo(350, y).lineTo(550, y).stroke();
    y += 12;

    doc
      .fontSize(13)
      .text(`Grand Total: ₹ ${grandTotal.toFixed(2)}`, 350, y, {
        align: "right"
      });

    y += 50;

    /* ================= FOOTER ================= */

    doc
      .fontSize(10)
      .fillColor("gray")
      .text(
        "This is a computer generated invoice. No signature required.",
        50,
        y,
        { align: "center", width: 500 }
      );

    y += 20;

    doc
      .fontSize(11)
      .fillColor("#000")
      .text("Thank you for shopping with AKC Auto Parts.", 50, y, {
        align: "center",
        width: 500
      });

    doc.end();

  } catch (err) {
    console.error("Invoice error:", err);
    res.status(500).send("Invoice error");
  }
});

module.exports = router;
