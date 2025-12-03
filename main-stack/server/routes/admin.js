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

module.exports = router;
