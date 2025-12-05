import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8888'

const client = axios.create({ baseURL: API_URL, withCredentials: true })

export async function getWishlist() {
    return client.get("/api/user/get-wishlist")
}

export async function submitFeedback(data) {
    return client.post('/api/user/feedback', data);
}

export async function getMetrics() {
    return client.get('/api/user/getMetrics');
}


export default client;