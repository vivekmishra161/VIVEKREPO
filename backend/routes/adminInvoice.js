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

    const doc = new PDFDocument({ size: "A4", margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order.id}.pdf`
    );

    doc.pipe(res);

    // =====================
    // HEADER
    // =====================
    doc
      .fontSize(22)
      .text("AKC AUTO PARTS", { align: "center" })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .text("AKC Hyundai, Parsakhera Industrial Area", { align: "center" })
      .text("Phone: +91 63975 40110", { align: "center" })
      .moveDown(2);

    // =====================
    // ORDER INFO
    // =====================
    doc.fontSize(12);
    doc.text(`Invoice No: ${order.id}`);
    doc.text(`Date: ${new Date(order.createdAt).toDateString()}`);
    doc.text(`Payment: ${order.paymentMethod}`);
    doc.text(`Status: ${order.status}`);
    doc.moveDown();

    // =====================
    // CUSTOMER
    // =====================
    doc.fontSize(13).text("Bill To:", { underline: true });
    doc.fontSize(11);
    doc.text(order.customerName);
    doc.text(order.phone);
    doc.text(`${order.address}, ${order.city}, ${order.state} - ${order.pin}`);
    doc.moveDown();

    // =====================
    // PRODUCTS TABLE
    // =====================
    doc.fontSize(12).text("Order Items", { underline: true });
    doc.moveDown(0.5);

    let y = doc.y;

    doc.fontSize(11);
    doc.text("Product", 40, y);
    doc.text("Qty", 330, y);
    doc.text("Price", 380, y);
    doc.text("Total", 460, y);

    y += 15;

    order.items.forEach(item => {
      const total = item.price * item.qty;

      doc.text(item.name, 40, y, { width: 270 });
      doc.text(item.qty, 340, y);
      doc.text(`₹${item.price.toFixed(2)}`, 380, y);
      doc.text(`₹${total.toFixed(2)}`, 460, y);

      y += 18;
    });

    doc.moveDown(2);

    // =====================
    // GRAND TOTAL
    // =====================
    doc
      .fontSize(14)
      .text(`Grand Total: ₹ ${Number(order.totalPrice).toFixed(2)}`, {
        align: "right"
      });

    doc.moveDown(2);

    doc
      .fontSize(10)
      .text("This is a computer generated invoice.", {
        align: "center"
      });

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).send("Invoice error");
  }
});

module.exports = router;
