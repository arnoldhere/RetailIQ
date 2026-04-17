const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth');
const demandForecastController = require('../controllers/demandForecastController');

// Get demand forecast for a specific product
router.get('/products/:productId', authMiddleware, demandForecastController.getDemandForecast);

// Bulk demand forecasting for multiple products
router.post('/bulk', authMiddleware, demandForecastController.getBulkDemandForecast);

module.exports = router;