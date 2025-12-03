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

router.get("/get-users", authMiddleware, async(req,res,next)=>{
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

module.exports = router;
