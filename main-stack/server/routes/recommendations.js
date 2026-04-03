const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth');
const recommendationController = require('../controllers/recommendationController');

// The products page calls this after navigation so the backend can validate
// the authenticated customer, enrich the request, and forward it to FastAPI.
router.post('/products', authMiddleware, recommendationController.getProductRecommendations);

module.exports = router;
