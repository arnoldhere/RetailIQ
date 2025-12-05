const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middlewares/auth');

// All cart routes require authentication and customer role
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return cartController.getCart(req, res);
  } catch (err) {
    next(err);
  }
});

router.post('/add', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return cartController.addToCart(req, res);
  } catch (err) {
    next(err);
  }
});

router.delete('/item/:cartItemId', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return cartController.removeFromCart(req, res);
  } catch (err) {
    next(err);
  }
});

router.put('/item/:cartItemId', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return cartController.updateCartItemQuantity(req, res);
  } catch (err) {
    next(err);
  }
});

router.delete('/clear', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return cartController.clearCart(req, res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

