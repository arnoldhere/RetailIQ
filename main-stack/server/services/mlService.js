const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
const axiosRetryableErrorCodes = new Set(['ECONNABORTED', 'ECONNREFUSED', 'ETIMEDOUT']);

function parseMlServiceTimeout() {
  const rawTimeout = process.env.ML_SERVICE_TIMEOUT_MS;

  if (rawTimeout === undefined || rawTimeout === null || rawTimeout === '') {
    return 0;
  }

  const parsedTimeout = Number(rawTimeout);
  if (!Number.isFinite(parsedTimeout) || parsedTimeout < 0) {
    return 0;
  }

  return parsedTimeout;
}

const mlClient = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: parseMlServiceTimeout(),
  headers: {
    'Content-Type': 'application/json',
  },
});

function buildMlServiceError(error, operation) {
  const status = error.response?.status;
  const detail = error.response?.data?.detail || error.response?.data?.message || error.message;
  const code = error.code || 'ML_SERVICE_ERROR';
  const normalizedError = new Error(`${operation} failed: ${detail}`);

  normalizedError.name = 'MlServiceError';
  normalizedError.code = code;
  normalizedError.status = status || 503;
  normalizedError.retryable = axiosRetryableErrorCodes.has(code) || (status >= 500 && status < 600);
  normalizedError.details = error.response?.data;

  return normalizedError;
}

async function getProductRecommendations(payload) {
  try {
    const response = await mlClient.post('/recommendations/products', payload);
    return response.data;
  } catch (error) {
    throw buildMlServiceError(error, 'Recommendation request');
  }
}

async function getDemandForecast(productId, daysAhead = 7, historicalDays = 30, historicalData = []) {
  try {
    const response = await mlClient.post('/demand-forecasting', {
      product_id: productId,
      days_ahead: daysAhead,
      historical_days: historicalDays,
      historical_data: historicalData,
    });
    return response.data;
  } catch (error) {
    throw buildMlServiceError(error, `Demand forecast request for product ${productId}`);
  }
}

async function getHealth() {
  try {
    const response = await mlClient.get('/health');
    return response.data;
  } catch (error) {
    throw buildMlServiceError(error, 'Health check');
  }
}

module.exports = {
  getProductRecommendations,
  getDemandForecast,
  getHealth,
};
