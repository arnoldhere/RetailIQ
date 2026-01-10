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

// Supplier specific profile fetch (for supplier users)
router.get('/supplier-profile', authMiddleware, async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'supplier') return res.status(403).json({ message: 'Forbidden' });
        return UserController.getSupplierProfile(req, res);
    } catch (err) {
        next(err);
    }
})

// Supplier: create supply order (request to supply product(s) to a store)
router.post('/supplier/orders', authMiddleware, async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'supplier') return res.status(403).json({ message: 'Forbidden' });
        return UserController.supplierCreateSupplyOrder(req, res);
    } catch (err) {
        next(err);
    }
})

// Supplier: list own supply orders
router.get('/supplier/orders', authMiddleware, async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'supplier') return res.status(403).json({ message: 'Forbidden' });
        return UserController.supplierListOrders(req, res);
    } catch (err) {
        next(err);
    }
})

// Supplier: view open asks
router.get('/supplier/asks', authMiddleware, async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'supplier') return res.status(403).json({ message: 'Forbidden' });
        const bidController = require('../controllers/bidController');
        return bidController.supplierListAsks(req, res);
    } catch (err) {
        next(err);
    }
})

// Supplier: place bid on ask
router.post('/supplier/asks/:askId/bids', authMiddleware, async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'supplier') return res.status(403).json({ message: 'Forbidden' });
        const bidController = require('../controllers/bidController');
        return bidController.supplierPlaceBid(req, res);
    } catch (err) {
        next(err);
    }
})

// Supplier: list own bids
router.get('/supplier/bids', authMiddleware, async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'supplier') return res.status(403).json({ message: 'Forbidden' });
        const bidController = require('../controllers/bidController');
        return bidController.supplierListBids(req, res);
    } catch (err) {
        next(err);
    }
})

router.get('/get-aboutus-stat', authMiddleware, async (req, res) => {
    try {
        return UserController.getAboutus(req, res);
    } catch (err) {
        next(err);
    }
})

module.exports = router;
