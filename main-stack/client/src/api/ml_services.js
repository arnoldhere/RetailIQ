import client from './base'

export async function getRecommendedProducts(userId, limit = 8) {
    const response = await client.post('/api/recommendations/products', {
        userId,
        limit,
    })

    return response.data
}

export async function getDemandForecast(productId, daysAhead = 7, historicalDays = 30) {
    const response = await client.get(`/api/demand-forecast/products/${productId}`, {
        params: {
            daysAhead,
            historicalDays,
        },
    })

    return response.data
}

export async function getBulkDemandForecast(productIds, daysAhead = 7, historicalDays = 30) {
    const response = await client.post('/api/demand-forecast/bulk', {
        productIds,
        daysAhead,
        historicalDays,
    })

    return response.data
}

export default client
