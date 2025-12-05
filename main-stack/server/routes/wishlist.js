const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const authMiddleware = require('../middlewares/auth');

// All wishlist routes require authentication and customer role
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return wishlistController.getWishlist(req, res);
  } catch (err) {
    next(err);
  }
});

router.post('/add', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return wishlistController.addToWishlist(req, res);
  } catch (err) {
    next(err);
  }
});

router.delete('/item/:wishlistItemId', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return wishlistController.removeFromWishlistById(req, res);
  } catch (err) {
    next(err);
  }
});

router.delete('/product/:productId', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return wishlistController.removeFromWishlistByProductId(req, res);
  } catch (err) {
    next(err);
  }
});

router.delete('/clear', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return wishlistController.clearWishlist(req, res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

