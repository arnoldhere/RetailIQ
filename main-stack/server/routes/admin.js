const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/auth');

// All admin routes require auth + admin role
router.get('/overview', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.overview(req, res);
  } catch (err) {
    next(err);
  }
});

router.get("/get-users", authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.getUsers(req, res);
  } catch (err) {
    next(err);
  }
})

// Categories routes
router.get('/categories', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.listCategories(req, res);
  } catch (err) {
    next(err);
  }
});

router.post('/categories', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.createCategory(req, res);
  } catch (err) {
    next(err);
  }
});

router.put('/categories/:id', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.updateCategory (req, res);
  } catch (err) {
    next(err);
  }
});

router.delete('/categories/:id', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.deleteCategory(req, res);
  } catch (err) {
    next(err);
  }
});

// Products routes
const upload = require('../middlewares/upload')

router.get('/products', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.listProducts(req, res);
  } catch (err) {
    next(err);
  }
});

// Accept optional multipart uploads (field name: images)
router.post('/products', authMiddleware, upload.array('images', 5), async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.createProduct(req, res);
  } catch (err) {
    next(err);
  }
});

router.put('/products/:id', authMiddleware, upload.array('images', 5), async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.updateProduct(req, res);
  } catch (err) {
    next(err);
  }
});

router.delete('/products/:id', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.deleteProduct(req, res);
  } catch (err) {
    next(err);
  }
});

router.get('/get-feedbacks', authMiddleware, async (req, res, nxt) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.getFeedbacks(req, res);
  } catch (err) {
    nxt(err);
  }
})

router.get('/suppliers', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.listSuppliers(req, res);
  } catch (err) {
    next(err);
  }
});

router.post('/suppliers', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.createSupplier(req, res);
  } catch (err) {
    next(err);
  }
});

router.put('/suppliers/:id', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.updateSupplier(req, res);
  } catch (err) {
    next(err);
  }
});

router.delete('/suppliers/:id', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.deleteSupplier(req, res);
  } catch (err) {
    next(err);
  }
});

// Store managers (store_owner) routes
router.get('/store-managers', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.listStoreManagers(req, res);
  } catch (err) {
    next(err);
  }
});

// simple list for select fields
router.get('/store-managers/simple', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.listStoreManagersSimple(req, res);
  } catch (err) {
    next(err);
  }
});

router.post('/store-managers', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.createStoreManager(req, res);
  } catch (err) {
    next(err);
  }
});

router.put('/store-managers/:id', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.updateStoreManager(req, res);
  } catch (err) {
    next(err);
  }
});

router.delete('/store-managers/:id', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.deleteStoreManager(req, res);
  } catch (err) {
    next(err);
  }
});

router.get('/customer-orders', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.listCustomerOrders(req, res);
  } catch (err) {
    next(err);
  }
});

// Get order details
router.get('/customer-orders/:id', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.getCustomerOrderDetails(req, res);
  } catch (err) {
    next(err);
  }
});

// Update order status
router.post('/customer-orders/:id/status', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.updateCustomerOrderStatus(req, res);
  } catch (err) {
    next(err);
  }
});

// Deactivate / Reactivate user
router.post('/users/:id/deactivate', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.deactivateUser(req, res);
  } catch (err) {
    next(err);
  }
});

router.post('/users/:id/reactivate', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.reactivateUser(req, res);
  } catch (err) {
    next(err);
  }
});

router.get('/supplier-orders', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.listSupplierOrders(req, res);
  } catch (err) {
    next(err);
  }
});

// Admin: update supply order status
router.post('/supplier-orders/:id/status', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.updateSupplyOrderStatus(req, res);
  } catch (err) {
    next(err);
  }
});

router.post('/sendAssurance/:id', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.sendAssuranceEmail(req, res);
  } catch (err) {
    next(err);
  }
})

// Stores routes
router.get('/stores', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.listStores(req, res);
  } catch (err) {
    next(err);
  }
});

router.get('/stores/:id', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.getStoreDetails(req, res);
  } catch (err) {
    next(err);
  }
});

router.post('/stores', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.createStore(req, res);
  } catch (err) {
    next(err);
  }
});

router.put('/stores/:id', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.updateStore(req, res);
  } catch (err) {
    next(err);
  }
});

router.delete('/stores/:id', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.deleteStore(req, res);
  } catch (err) {
    next(err);
  }
});

// Admin asks and bids
router.post('/asks', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const bidController = require('../controllers/bidController');
    return bidController.createAsk(req, res);
  } catch (err) {
    next(err);
  }
});

router.get('/asks', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const bidController = require('../controllers/bidController');
    return bidController.listAsks(req, res);
  } catch (err) {
    next(err);
  }
});

router.get('/asks/:id', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const bidController = require('../controllers/bidController');
    return bidController.getAskDetails(req, res);
  } catch (err) {
    next(err);
  }
});

router.post('/asks/:id/close', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const bidController = require('../controllers/bidController');
    return bidController.closeAsk(req, res);
  } catch (err) {
    next(err);
  }
});

router.get('/bids', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const bidController = require('../controllers/bidController');
    return bidController.adminListBids(req, res);
  } catch (err) {
    next(err);
  }
});

router.post('/bids/:id/accept', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const bidController = require('../controllers/bidController');
    return bidController.acceptBid(req, res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
