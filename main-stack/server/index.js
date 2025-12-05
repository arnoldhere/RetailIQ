require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 8888;
const host = process.env.HOST || "localhost";
const path = require('path');

// basic app configurations
// parse json / urlencoded body and cookies
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));          // adjust size as needed
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS config - allow dev client by default, and allow cookies
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({ origin: CLIENT_URL, credentials: true }));

// mount routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// admin routes
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// public product routes (no auth required)
const productRoutes = require('./routes/products');
app.use('/api', productRoutes);

// user routes
const userRoutes = require("./routes/user")
app.use('/api/user', userRoutes);

// cart routes (customer)
const cartRoutes = require('./routes/cart');
app.use('/api/cart', cartRoutes);

// wishlist routes (customer)
const wishlistRoutes = require('./routes/wishlist');
app.use('/api/wishlist', wishlistRoutes);

// feedback routes
const feedbackRoutes = require('./routes/feedback');
app.use('/api/user/feedback', feedbackRoutes);

// serve media files (uploaded images)
app.use('/media', express.static(path.join(__dirname, 'media')));

app.get("/", (req, res) => {
	res.send("Hello World!");
});

app.listen(port, () => {
	console.log(`Server listening on  http://${host}:${port}`);
});