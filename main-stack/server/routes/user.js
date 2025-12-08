const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const UserController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');

router.get('/get-product-categories', authMiddleware, async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'customer') return res.status(403).json({ message: 'Forbidden' });
        return UserController.getProductCategories(req, res);
    } catch (err) { }
    console.log("Error in fetching categories for user...  ", error)
    return res.status(500).json({ message: "internal server error" })
})

// fetch wishlist
router.get("/get-wishlist", authMiddleware, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'customer') return res.status(403).json({ message: 'Forbidden' });
        return UserController.getProductCategories(req, res);
    } catch (err) { }
    console.log("Error in fetching categories for user...  ", error)
    return res.status(500).json({ message: "internal server error" })
})

router.get('/getMetrics', authMiddleware, async (req, res) => {
    try {
        // if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
        return UserController.getMetrics(req, res);
    } catch (err) {
        next(err);
    }
});

router.post('/edit-profile/:id', authMiddleware, async (req, res) => {
    try {
        if (!req.user) return res.status(403).json({ message: 'Forbidden' });
        return UserController.editProfile(req, res);
    } catch (err) {
        next(err);
    }
})

module.exports = router;
