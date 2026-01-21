const express = require("express");
const router = express.Router();
const bcrypt = require('bcryptjs');

const User = require("../models/user");   // lowercase file name
const Order = require("../models/order");

// ============================
// ADMIN LOGIN PAGE
// ============================
router.get("/login", (req, res) => {
  res.render("admin/login");
});

// ============================
// ADMIN LOGIN HANDLER (SQL)
// ============================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt with email:', email);
    console.log('🔐 Password received:', password);
    console.log('🔐 Password length:', password ? password.length : 0);
    console.log('🔐 Request body:', JSON.stringify(req.body));

    // Add validation
    if (!email || !password) {
      return res.render('admin/login', { error: 'Email and password required' });
    }

    const admin = await User.findOne({
      where: { email, role: 'admin' }
    });

    // ✅ Add user feedback
    if (!admin) {
      console.log('❌ Admin not found with email:', email);
      return res.render('admin/login', { error: 'Invalid email or password' });
    }

    console.log('✅ Admin found:', admin.email);
    console.log('🔍 Stored password hash:', admin.password);
    console.log('🔍 Stored password length:', admin.password ? admin.password.length : 0);
    console.log('🔍 Is bcrypt hash:', admin.password ? admin.password.startsWith('$2') : false);
    console.log('🔍 Input password:', password);
    console.log('🔍 Input password length:', password ? password.length : 0);

    let isPasswordValid = false;
    
    // Check if password is a bcrypt hash
    if (admin.password && admin.password.startsWith('$2')) {
      // ✅ Use bcrypt.compare() for secure password verification
      isPasswordValid = await bcrypt.compare(password, admin.password);
      console.log('🔑 Bcrypt compare result:', isPasswordValid);
    } else {
      // Plain text comparison (for legacy/debug purposes)
      isPasswordValid = (password === admin.password);
      console.log('🔑 Plain text compare result:', isPasswordValid);
    }
    
    console.log('🔑 Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Password mismatch for admin:', email);
      
      // Debug: Try hashing the input and compare
      const testHash = await bcrypt.hash(password, 10);
      console.log('🔍 Test hash of input password:', testHash);
      
      return res.render('admin/login', { error: 'Invalid email or password' });
    }

    // Set session
    req.session.user = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    };

    console.log('✨ Session created for admin:', admin.email);
    return res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('❌ Admin login error:', err);
    return res.render('admin/login', { error: 'Server error. Please try again.' });
  }
});


// ============================
// ADMIN LOGOUT
// ============================
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});

// ============================
// ADMIN UPDATE ORDER STATUS (SQL)
// ============================
router.post("/update-order-status", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "admin") {
      return res.status(403).json({ success: false });
    }

    const { orderId, status } = req.body;

    await Order.update(
      { status },
      { where: { id: orderId } }
    );

    res.json({ success: true });

  } catch (err) {
    console.log("Admin Update Status Error:", err);
    res.json({ success: false });
  }
});

module.exports = router;
