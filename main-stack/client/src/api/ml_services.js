import client from './base'

export async function getRecommendedProducts(userId, limit = 8) {
    const response = await client.post('/api/recommendations/products', {
        userId,
        limit,
    })

    return response.data
}

export default client
