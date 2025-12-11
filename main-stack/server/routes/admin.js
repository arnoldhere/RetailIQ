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
    return adminController.updateCategory(req, res);
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

router.get('/customer-orders', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.listCustomerOrders(req, res);
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

router.post('/sendAssurance/:id', authMiddleware, async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return adminController.sendAssuranceEmail(req, res);
  } catch (err) {
    next(err);
  }
})

module.exports = router;
