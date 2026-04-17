const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

const mlClient = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: Number(process.env.ML_SERVICE_TIMEOUT_MS) || 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

async function getProductRecommendations(payload) {
  const response = await mlClient.post('/recommendations/products', payload);
  return response.data;
}

async function getDemandForecast(productId, daysAhead = 7, historicalDays = 30, historicalData = []) {
  const response = await mlClient.post('/demand-forecasting', {
    product_id: productId,
    days_ahead: daysAhead,
    historical_days: historicalDays,
    historical_data: historicalData,
  });
  return response.data;
}

async function getHealth() {
  const response = await mlClient.get('/health');
  return response.data;
}

module.exports = {
  getProductRecommendations,
  getDemandForecast,
  getHealth,
};
