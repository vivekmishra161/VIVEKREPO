const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const Order = require("../models/order");
const adminAuth = require("../middleware/adminAuth");

router.get("/invoice/:id", adminAuth, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) return res.status(404).send("Order not found");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=AKC-INVOICE-${order.id}.pdf`
    );

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    /* =========================
       HEADER
    ========================== */

    doc
      .fontSize(22)
      .fillColor("#111827")
      .text("AKC AUTO PARTS", { align: "left" });

    doc
      .fontSize(10)
      .fillColor("#374151")
      .text("GST INVOICE", { align: "left" });

    doc.moveDown(0.5);

    doc
      .moveTo(50, 100)
      .lineTo(550, 100)
      .strokeColor("#e5e7eb")
      .stroke();

    /* =========================
       INVOICE META
    ========================== */

    doc.moveDown(1);

    doc.fontSize(11).fillColor("#111827");
    doc.text(`Invoice No: AKC-${order.id}`);
    doc.text(`Date: ${new Date(order.createdAt).toDateString()}`);

    doc.moveDown();

    /* =========================
       CUSTOMER BOX
    ========================== */

    doc
      .rect(50, doc.y, 500, 90)
      .fillOpacity(0.03)
      .fill("#2563eb")
      .fillOpacity(1);

    doc
      .fillColor("#111827")
      .fontSize(12)
      .text("BILL TO", 60, doc.y - 75);

    doc.fontSize(11);
    doc.text(`Name: ${order.customerName}`, 60);
    doc.text(`Phone: ${order.phone || "N/A"}`, 60);
    doc.text(
      `Address: ${order.address}, ${order.city}, ${order.state} - ${order.pin}`,
      60,
      undefined,
      { width: 460 }
    );

    doc.moveDown(2);

    /* =========================
       TABLE HEADER
    ========================== */

    const tableTop = doc.y;

    doc
      .rect(50, tableTop, 500, 25)
      .fill("#1f2937");

    doc
      .fillColor("#ffffff")
      .fontSize(11)
      .text("No", 60, tableTop + 7)
      .text("Product", 100, tableTop + 7)
      .text("Qty", 360, tableTop + 7)
      .text("Price", 420, tableTop + 7)
      .text("Total", 490, tableTop + 7, { align: "right" });

    let y = tableTop + 30;
    let grandTotal = 0;

    doc.fillColor("#111827");

    order.items.forEach((item, index) => {
      const lineTotal = item.price * item.qty;
      grandTotal += lineTotal;

      doc
        .fontSize(10)
        .text(index + 1, 60, y)
        .text(`${item.name} (${item.id})`, 100, y, { width: 250 })
        .text(item.qty, 360, y)
        .text(`₹${item.price}`, 420, y)
        .text(`₹${lineTotal.toFixed(2)}`, 490, y, { align: "right" });

      y += 22;
    });

    /* =========================
       TOTAL BOX
    ========================== */

    doc
      .moveTo(350, y + 10)
      .lineTo(550, y + 10)
      .strokeColor("#e5e7eb")
      .stroke();

    doc
      .fontSize(13)
      .fillColor("#111827")
      .text(
        `Grand Total: ₹ ${Number(order.totalPrice).toFixed(2)}`,
        350,
        y + 20,
        { align: "right" }
      );

    /* =========================
       FOOTER
    ========================== */

    doc.moveDown(4);

    doc
      .fontSize(10)
      .fillColor("#6b7280")
      .text(
        "This is a computer generated invoice. No signature required.",
        { align: "center" }
      );

    doc
      .moveDown(0.5)
      .fontSize(11)
      .fillColor("#111827")
      .text("Thank you for shopping with AKC Auto Parts.", {
        align: "center"
      });

    doc.end();

  } catch (err) {
    console.error("Invoice error:", err);
    res.status(500).send("Invoice generation failed");
  }
});

module.exports = router;
