require("dotenv").config();
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,       // test key id
    key_secret: process.env.RAZORPAY_KEY_SECRET // test key secret
});

module.exports = razorpay;