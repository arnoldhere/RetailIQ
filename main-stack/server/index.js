require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 8888;
const host = process.env.HOST || "localhost";

// basic app configurations
// parse json / urlencoded body and cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS config - allow dev client by default, and allow cookies
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({ origin: CLIENT_URL, credentials: true }));

// mount routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

app.get("/", (req, res) => {
	res.send("Hello World!");
});

app.listen(port, () => {
	console.log(`Server listening on  http://${host}:${port}`);
});