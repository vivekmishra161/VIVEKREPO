require("dotenv").config();

const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const Order = require("./models/order");
const Review = require("./models/review");
const Product = require("./models/product");
const adminInvoice = require("./routes/adminInvoice");
const sequelize = require("./config/database");
const User = require("./models/user");
const crypto = require("crypto");
const { getProducts } = require("./models/productData");

const app = express();
app.use((req, res, next) => {
  console.log("➡️ REQUEST:", req.method, req.url);
  next();
});

app.use(express.static(path.join(__dirname, "public")));
/* =====================
   EXPRESS CONFIG
===================== */

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(cookieParser());

app.use(
  session({
    secret: "AKC_SECRET_KEY_123",
    resave: false,
    saveUninitialized: false, // Change this to false
    cookie: { 
      secure: false, // Set to true ONLY if using HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);
app.use(express.static(path.join(__dirname, "public")));
// Middleware to make session available to all EJS templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.use(require("./middleware/language"));

app.get("/test-products", async (req, res) => {
  const { getProducts } = require("./models/productData");
  const products = await getProducts();
  res.json(products);
});

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

/* =====================
   ROUTES
===================== */
app.use("/admin", require("./routes/admin"));
app.use("/admin", require("./routes/admindashboard"));
app.use("/admin", require("./routes/adminorders"));
app.use("/admin", require("./routes/adminusers"));
app.use('/admin', require('./routes/adminproduct'));
app.use("/admin", adminInvoice);
app.get("/", async (req, res) => {
  try {
    const dbProducts = await Product.findAll({
      order: [["id", "DESC"]],
      limit: 40
    });

   const products = dbProducts.map(p => ({
  id: p.part_no,
  name: p.name,
  manufacturer: p.manufacturer,     // 👈 important
  category: p.category,        // 👈 important
  price: p.price,
  discount: p.discount || 0,
  finalPrice: p.final_price,
  stock: p.stock,
  image: `/images/categories/${p.category.toLowerCase()}.jpg`

}));


    res.render("index", { products });

  } catch (err) {
    console.log("❌ Homepage DB error:", err.message);
    res.render("index", { products: [] });
  }
});
const { Op } = require("sequelize");

app.get("/api/products", async (req, res) => {
  try {
    const {
      category,
      manufacturer,
      minPrice,
      maxPrice,
      search,
      sort = "relevance"
    } = req.query;

    const where = {};
    let order = [];

    // 📦 Category filter
    if (category) {
      where.category = category;
    }

    // 🏭 Manufacturer filter
    if (manufacturer) {
      where.manufacturer = manufacturer;
    }

    // 💰 Price range
    if (minPrice || maxPrice) {
      where.final_price = {};
      if (minPrice) where.final_price[Op.gte] = Number(minPrice);
      if (maxPrice) where.final_price[Op.lte] = Number(maxPrice);
    }

    // 🔍 Search
    if (search) {
      where[Op.or] = [
        { part_no: { [Op.iLike]: `%${search}%` } },
        { name: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // 🔃 SORTING (THIS IS THE KEY FIX)
    if (sort === "price-asc") {
      order = [["final_price", "ASC"]];
    } else if (sort === "price-desc") {
      order = [["final_price", "DESC"]];
    } else if (sort === "name-asc") {
      order = [["name", "ASC"]];
    } else {
      // relevance / default
      order = [["id", "DESC"]];
    }

    const results = await Product.findAll({
      where,
      order,
      limit: 40
    });

    res.json(
      results.map(p => ({
        id: p.part_no,
        name: p.name,
        manufacturer: p.manufacturer,
        category: p.category,
        price: p.price,
        finalPrice: p.final_price,
        discount: p.discount,
        stock: p.stock,
        image: `/images/categories/${p.category.toLowerCase()}.jpg`

      }))
    );
  } catch (err) {
    console.error("PRODUCT FILTER ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/search", async (req, res) => {
  const q = req.query.q?.trim();

  if (!q || q.length < 2) {
    return res.json([]);
  }

  const results = await Product.findAll({
    where: {
      [Op.or]: [
        { part_no: { [Op.iLike]: `%${q}%` } },
        { name: { [Op.iLike]: `%${q}%` } }
      ]
    },
    limit: 20
  });

  const products = results.map(p => ({
    id: p.part_no,
    name: p.name,
    manufacturer: p.manufacturer,
    category: p.category,
    price: p.price,
    discount: p.discount || 0,
    finalPrice: p.final_price,
    stock: p.stock,
    image: `/images/categories/${p.category.toLowerCase()}.jpg`
  }));

  res.json(products);
});

app.get("/signin", (req, res) => res.render("signin", { popup: "" }));
app.get("/signup", (req, res) => res.render("signup", { popup: "" }));

app.get("/cart", (req, res) => {
  res.render("cart", {
    isLoggedIn: req.session.user ? true : false
  });
});
app.use("/admin", require("./routes/sync"));
app.get("/product", async (req, res) => {
  try {
    const partNo = req.query.id;

    if (!partNo) {
      return res.redirect("/");
    }

    // 🔥 FETCH FROM DATABASE ONLY
    const product = await Product.findOne({
      where: { part_no: partNo }
    });

    if (!product) {
      return res.render("product-not-found", { id: partNo });
    }

    // 🔥 SEND DB PRODUCT TO EJS
    res.render("product", {
      product: {
        id: product.part_no,
        name: product.name,
        category: product.category,
        manufacturer: product.manufacturer ,
        price: product.price,
        discount: product.discount || 0,
        finalPrice: product.final_price,
        stock: product.stock || "In Stock",
        image: `/images/categories/${product.category.toLowerCase()}.jpg`
      }
    });

  } catch (err) {
    console.error("❌ PRODUCT PAGE ERROR:", err);
    res.status(500).send("Server error");
  }
});



/* =====================
   AUTH (SQL)
===================== */

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      return res.render("signup", { popup: "exists" });
    }

    await User.create({
  name,
  email,
  password,
  role: "user"
});


    res.render("signup", { popup: "success" });
  } catch (err) {
    console.log("Signup error:", err);
    res.render("signup", { popup: "error" });
  }
});

app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email, password }
    });

    if (!user) {
      return res.render("signin", { popup: "failed" });
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    res.render("signin", { popup: "success" });
  } catch (err) {
    console.log("Signin error:", err);
    res.render("signin", { popup: "error" });
  }
});
app.get("/registration", (req, res) => {
  res.render("registration");
});

app.get("/signout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});
app.get("/forgot-password", (req, res) => {
  res.render("forgotPassword");
});


app.get("/my-orders", async (req, res) => {
  try {
    if (!req.session.user) return res.redirect("/signin");

    const orders = await Order.findAll({
      where: {
        userId: req.session.user.id
      },
      order: [["createdAt", "DESC"]]
    });

    // Fetch products from Google Sheets to enrich items with name and price
    let products = [];
    try {
      products = await getProducts();
    } catch (prodErr) {
      console.log("Error fetching products:", prodErr.message);
    }

    // Enrich orders with product details
    const enrichedOrders = [];
    for (const order of orders) {
      const plainOrder = order.dataValues || order;
      let items = plainOrder.items;

      if (typeof items === "string") {
        try {
          items = JSON.parse(items);
        } catch (e) {
          items = [];
        }
      }

      // Add name and price from products
      if (items && Array.isArray(items)) {
        items = items.map(item => {
          const product = products.find(p => p.id === item.id);
          return {
            id: item.id,
            name: item.name || (product ? product.name : "Unknown"),
            price: item.price || (product ? product.price : 0),
            qty: item.qty,
            // 🔥 KEEP THESE
            category: item.category || (product ? product.category : null),
            img:
              item.img ||
                (product
                 ? `/images/categories/${product.category.toLowerCase()}.jpg`
                 : "/images/categories/default.jpg")
          };
        });
      }

      enrichedOrders.push({
        ...plainOrder,
        items
      });
    }

    res.render("myOrders", { orders: enrichedOrders });

  } catch (err) {
    console.log("My orders error:", err);
    res.render("myOrders", { orders: [] });
  }
});


app.post("/order", async (req, res) => {
  try {
    console.log("➡️ ORDER BODY:", req.body);

    const {
      name,
      address,
      city,
      state,
      phone,
      pin,
      total,
      items,
      paymentMethod,
      utrNumber
    } = req.body;

    if (!items || items.length === 0) {
      return res.json({ success: false, message: "Cart is empty" });
    }

    const safeItems = items.map(item => ({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      discount: Number(item.discount || 0),
      qty: Number(item.qty || 1),
      category: item.category,  
      img: item.img   
    }));

     let subtotal = 0;

     safeItems.forEach(i => {
      subtotal += i.price * i.qty;
       });

const GST_RATE = 0.18;
const gstAmount = subtotal * GST_RATE;
const calculatedTotal = subtotal + gstAmount;


    if (calculatedTotal <= 0) {
      return res.json({ success: false, message: "Invalid total" });
    }

    const order = await Order.create({
      userId: req.session.user ? req.session.user.id : 0,


      customerName: name,
      address,
      city,
      state,
      phone,
      pin,

      totalPrice: calculatedTotal,
      items: safeItems,

      paymentMethod,
      utrNumber: paymentMethod === "UPI" ? utrNumber : null,

      paymentStatus:
        paymentMethod === "COD"
          ? "COD"
          : "PAYMENT_PENDING",

      status: "Pending"
    });

    console.log("✅ ORDER SAVED:", order.id);

    req.session.cart = [];

    res.json({ success: true });

  } catch (err) {
    console.error("❌ ORDER ERROR:", err);
    res.json({ success: false, message: err.message });
  }
});

app.post("/cancel-order/:id", async (req, res) => {
  try {
    const orderId = req.params.id;

    await Order.update(
      { status: "Cancelled" },
      { where: { id: orderId } }
    );

    res.json({ success: true });

  } catch (err) {
    console.log("Cancel order error:", err);
    res.json({ success: false });
  }
});

app.get("/registration", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.render("registration");
});

/* =====================
   REVIEWS ROUTES
===================== */

// GET reviews for a specific product
app.get("/reviews/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.findAll({
      where: { productId },
      order: [["date", "DESC"]]
    });

    const plainReviews = reviews.map(r => ({
      id: r.id,
      productId: r.productId,
      userId: r.userId,
      userName: r.userName,
      message: r.message,
      rating: r.rating,
      date: r.date
    }));

    res.json(plainReviews);

  } catch (err) {
    console.log("❌ Get reviews error:", err);
    res.json([]);
  }
});

// GET average rating and count for a product
app.get("/rating/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.findAll({
      where: { productId }
    });

    if (reviews.length === 0) {
      return res.json({ avg: 0, count: 0 });
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = (totalRating / reviews.length).toFixed(1);

    res.json({ avg: avgRating, count: reviews.length });

  } catch (err) {
    console.log("❌ Get rating error:", err);
    res.json({ avg: 0, count: 0 });
  }
});

// POST a new review
app.post("/review", async (req, res) => {
  try {
    const { productId, message, rating } = req.body;

    if (!req.session.user) {
      return res.json({ success: false, message: "Please sign in to write a review" });
    }

    if (!productId || !message) {
      return res.json({ success: false, message: "Product ID and message are required" });
    }

    // Validate rating
    const ratingValue = Number(rating) || 5;
    if (ratingValue < 1 || ratingValue > 5) {
      return res.json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const review = await Review.create({
      productId,
      userId: req.session.user.id,
      userName: req.session.user.name,
      message,
      rating: ratingValue
    });

    res.json({ 
      success: true, 
      message: "Review posted successfully",
      review
    });

  } catch (err) {
    console.log("❌ Post review error:", err);
    res.json({ success: false, message: err.message });
  }
});
app.get("/admin/dashboard", async (req, res) => {
  const orders = await Order.find();

  const productSales = {};

  orders.forEach(order => {
    order.items.forEach(item => {
      if (!productSales[item.name]) {
        productSales[item.name] = 0;
      }

      productSales[item.name] += item.price * item.qty;
    });
  });

  // convert to array
  const topProducts = Object.entries(productSales)
    .map(([name, total]) => ({
      name,
      total
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  res.render("admin/dashboard", {
    topProducts,
    totalRevenue,
    totalOrders,
    delivered,
    cancelled,
    pending,
    packed
  });
});

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
app.post("/forgot-password", async (req, res) => {
  try {
    console.log("➡️ FORGOT PASSWORD CALLED");

    const { email } = req.body;
    console.log("📩 Email received:", email);

    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log("❌ USER NOT FOUND");
      return res.json({ success: false, message: "User not found" });
    }

    console.log("✅ USER FOUND");

    const token = require("crypto").randomBytes(32).toString("hex");

    await User.update(
      {
        resetToken: token,
        resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000)
      },
      { where: { id: user.id } }
    );

    console.log("🔐 TOKEN SAVED:", token);

    const { Resend } = require("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log("🔑 API KEY:", process.env.RESEND_API_KEY);

    const resetLink = `https://akcautoparts.onrender.com/reset-password/${token}`;

    const result = await resend.emails.send({
      from: "AKC Auto Parts <onboarding@resend.dev>",
      to: email,
      subject: "Reset Password",
      html: `<p>Reset link:</p><a href="${resetLink}">${resetLink}</a>`
    });

    console.log("📨 RESEND RESPONSE:", result);

    res.json({ success: true, message: "Email sent" });

  } catch (err) {
    console.error("🔥 EMAIL ERROR FULL:", err);
    res.json({ success: false, error: err.message });
  }
});
app.get("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.send("Reset link is invalid or expired");
    }

    // Render reset password page
    res.render("resetPassword", { token });

  } catch (err) {
    console.log(err);
    res.send("Something went wrong");
  }
});

app.post("/reset-password", async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    // 1️⃣ password match check
    if (password !== confirmPassword) {
      return res.send("Passwords do not match");
    }

    // 2️⃣ find valid token
    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.send("Reset link invalid or expired");
    }

    // 3️⃣ update password
    await User.update(
      {
        password: password,
        resetToken: null,
        resetTokenExpiry: null
      },
      { where: { id: user.id } }
    );

    // 4️⃣ success
    res.send(`
      <h2>Password changed successfully</h2>
      <a href="/signin">Go to Login</a>
    `);

  } catch (err) {
    console.log("RESET PASSWORD ERROR:", err);
    res.send("Something went wrong");
  }
});


/* =====================
   DATABASE + SERVER
===================== */
app.get("/__debug-products", async (req, res) => {
  const { getProducts } = require("./models/productData");

  const products = await getProducts();

  res.json({
    count: products.length,
    products
  });
});

sequelize.authenticate()
  .then(async () => {
    console.log("✅ PostgreSQL connected");

    await sequelize.sync({ alter: true });
    console.log("✅ Tables synced");

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚗 Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.log("❌ Database connection error:");
    console.log(err.message);
  });
