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

module.exports = router;
