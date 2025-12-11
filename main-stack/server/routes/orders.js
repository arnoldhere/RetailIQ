const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/auth');

/**
 * Create Razorpay payment order
 * POST /api/orders/create-razorpay-order
 * Body: { items, totalAmount, taxAmount, shippingAmount }
 * Requires: Authentication
 */
router.post('/create-razorpay-order', authMiddleware, async (req, res, next) => {
  try {
    // ✅ Verify user is authenticated
    if (!req.user || req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can place orders' });
    }
    return orderController.createRazorpayOrder(req, res);
  } catch (err) {
    next(err);
  }
});

/**
 * Verify payment and confirm order
 * POST /api/orders/verify-payment
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }
 * Requires: Authentication
 */
router.post('/verify-payment', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can verify payments' });
    }
    return orderController.verifyPayment(req, res);
  } catch (err) {
    next(err);
  }
});

/**
 * Get order details
 * GET /api/orders/:orderId
 * Requires: Authentication
 */
router.get('/:orderId', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can view orders' });
    }
    return orderController.getOrderDetails(req, res);
  } catch (err) {
    next(err);
  }
});

/**
 * Get all orders for logged-in user
 * GET /api/orders
 * Requires: Authentication
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can view orders' });
    }
    return orderController.getUserOrders(req, res);
  } catch (err) {
    next(err);
  }
});

/**
 * Cancel order
 * PUT /api/orders/:orderId/cancel
 * Requires: Authentication
 */
router.put('/:orderId/cancel', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can cancel orders' });
    }
    return orderController.cancelOrder(req, res);
  } catch (err) {
    next(err);
  }
});


module.exports = router;
