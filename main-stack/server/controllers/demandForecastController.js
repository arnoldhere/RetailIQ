const db = require('../config/db');
const mlService = require('../services/mlService');

function buildForecastFallback(productId, daysAhead, historicalData, errorMessage) {
  return {
    product_id: productId,
    forecast_next_7_days: new Array(Math.min(daysAhead, 7)).fill(0),
    algorithm_used: 'service_unavailable',
    confidence_score: 0.0,
    historical_data_points: historicalData.length,
    model_source: 'fallback',
    error_message: errorMessage,
  };
}

async function getDemandForecast(req, res) {
  try {
    const { productId } = req.params;
    const { daysAhead = 7, historicalDays = 30 } = req.query;

    // Validate product ID
    const productIdNum = parseInt(productId, 10);
    if (isNaN(productIdNum) || productIdNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID. Must be a positive integer.',
      });
    }

    // Validate parameters
    const daysAheadNum = parseInt(daysAhead, 10);
    const historicalDaysNum = parseInt(historicalDays, 10);

    if (daysAheadNum < 1 || daysAheadNum > 30) {
      return res.status(400).json({
        success: false,
        message: 'daysAhead must be between 1 and 30.',
      });
    }

    if (historicalDaysNum < 7 || historicalDaysNum > 365) {
      return res.status(400).json({
        success: false,
        message: 'historicalDays must be between 7 and 365.',
      });
    }

    // Check if product exists
    const productCheck = await db('products')
      .select('id', 'name')
      .where('id', productIdNum)
      .first();

    if (!productCheck) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    // Fetch historical order data for the product
    const historicalData = await db('customer_order_items')
      .select(
        db.raw('DATE(customer_orders.created_at) as date'),
        'customer_order_items.qty as quantity'
      )
      .join('customer_orders', 'customer_order_items.customer_order_id', 'customer_orders.id')
      .where('customer_order_items.product_id', productIdNum)
      .where('customer_orders.status', 'completed') // Only completed orders
      .where('customer_orders.created_at', '>=', db.raw(`DATE_SUB(NOW(), INTERVAL ${historicalDaysNum} DAY)`))
      .orderBy('customer_orders.created_at', 'asc');

    // Try to get forecast from ML service using actual historical data
    let forecastResult;
    try {
      forecastResult = await mlService.getDemandForecast(
        productIdNum,
        daysAheadNum,
        historicalDaysNum,
        historicalData
      );
    } catch (mlError) {
      console.warn(`ML service failed for product ${productIdNum}:`, {
        message: mlError.message,
        code: mlError.code,
        status: mlError.status,
        retryable: mlError.retryable,
      });

      forecastResult = buildForecastFallback(
        productIdNum,
        daysAheadNum,
        historicalData,
        mlError.message
      );
    }

    // Return successful response
    res.json({
      success: true,
      data: {
        product: {
          id: productCheck.id,
          name: productCheck.name,
        },
        forecast: forecastResult,
        historical_data_used: historicalData.length,
        requested_period: {
          days_ahead: daysAheadNum,
          historical_days: historicalDaysNum,
        },
      },
    });

  } catch (error) {
    console.error('Error in getDemandForecast:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while generating demand forecast.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

async function getBulkDemandForecast(req, res) {
  try {
    const { productIds, daysAhead = 7, historicalDays = 30 } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'productIds must be a non-empty array.',
      });
    }

    if (productIds.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Cannot forecast more than 50 products at once.',
      });
    }

    // Validate parameters
    const daysAheadNum = parseInt(daysAhead, 10);
    const historicalDaysNum = parseInt(historicalDays, 10);

    if (daysAheadNum < 1 || daysAheadNum > 30) {
      return res.status(400).json({
        success: false,
        message: 'daysAhead must be between 1 and 30.',
      });
    }

    if (historicalDaysNum < 7 || historicalDaysNum > 365) {
      return res.status(400).json({
        success: false,
        message: 'historicalDays must be between 7 and 365.',
      });
    }

    const results = [];
    const errors = [];

    // Process each product
    for (const productId of productIds) {
      try {
        const productIdNum = parseInt(productId, 10);
        if (isNaN(productIdNum) || productIdNum <= 0) {
          errors.push({
            product_id: productId,
            error: 'Invalid product ID. Must be a positive integer.',
          });
          continue;
        }

        // Check if product exists
        const productCheck = await db('products')
          .select('id', 'name')
          .where('id', productIdNum)
          .first();

        if (!productCheck) {
          errors.push({
            product_id: productIdNum,
            error: 'Product not found.',
          });
          continue;
        }

        // Get forecast (same logic as single forecast)
        const forecastResult = await getDemandForecastForProduct(
          productIdNum,
          daysAheadNum,
          historicalDaysNum
        );

        results.push({
          product: {
            id: productCheck.id,
            name: productCheck.name,
          },
          forecast: forecastResult,
        });

      } catch (productError) {
        errors.push({
          product_id: productId,
          error: productError.message || 'Failed to generate forecast.',
        });
      }
    }

    res.json({
      success: true,
      data: {
        forecasts: results,
        errors: errors,
        summary: {
          total_requested: productIds.length,
          successful: results.length,
          failed: errors.length,
        },
      },
    });

  } catch (error) {
    console.error('Error in getBulkDemandForecast:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while generating bulk demand forecasts.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

// Helper function to get forecast for a single product
async function getDemandForecastForProduct(productId, daysAhead, historicalDays) {
  // Fetch historical data
  const historicalData = await db('customer_order_items')
    .select(
      db.raw('DATE(customer_orders.created_at) as date'),
      'customer_order_items.qty as quantity'
    )
    .join('customer_orders', 'customer_order_items.customer_order_id', 'customer_orders.id')
    .where('customer_order_items.product_id', productId)
    .where('customer_orders.status', 'completed')
    .where('customer_orders.created_at', '>=', db.raw(`DATE_SUB(NOW(), INTERVAL ${historicalDays} DAY)`))
    .orderBy('customer_orders.created_at', 'asc');

  // Try ML service
  try {
    return await mlService.getDemandForecast(productId, daysAhead, historicalDays, historicalData);
  } catch (mlError) {
    console.warn(`ML service failed for product ${productId}:`, {
      message: mlError.message,
      code: mlError.code,
      status: mlError.status,
      retryable: mlError.retryable,
    });
    return buildForecastFallback(productId, daysAhead, historicalData, mlError.message);
  }
}

module.exports = {
  getDemandForecast,
  getBulkDemandForecast,
};
