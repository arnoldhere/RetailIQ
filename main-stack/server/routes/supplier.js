const express = require('express');
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const supplierController = require("../controllers/supplierController")

router.get("/get-stores", authMiddleware, async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'supplier') return res.status(403).json({ message: 'Forbidden' });
        return supplierController.getStores(req, res);
    } catch (err) { }
    console.log("Error in fetching stores for supplier...  ", error)
    return res.status(500).json({ message: "internal server error" })
})



module.exports = router;