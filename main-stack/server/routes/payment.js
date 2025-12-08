const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const crypto = require('crypto');


// Create order endpoint
router.post('/create-order', async (req, res) => {
    const { amount, currency = 'INR', receipt } = req.body; // amount in smallest unit (paise)
    const options = {
        amount: amount,        // e.g., 50000 == Rs. 500.00
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        payment_capture: 1     // auto-capture
    };
    try {
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Order creation failed' });
    }
});

router.post('/api/verify-payment', (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

    if (generated_signature === razorpay_signature) {
        // signature valid -> mark order paid in DB
        return res.json({ ok: true, msg: 'Payment verified' });
    } else {
        return res.status(400).json({ ok: false, msg: 'Invalid signature' });
    }
});

// webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const shasum = crypto.createHmac('sha256', secret)
        .update(req.body)
        .digest('hex');
    const signature = req.headers['x-razorpay-signature'];
    if (shasum === signature) {
        const event = JSON.parse(req.body);
        // handle event: payment.captured, order.paid, etc.
        res.status(200).send('OK');
    } else {
        res.status(400).send('Invalid signature');
    }
});


module.exports = router;

