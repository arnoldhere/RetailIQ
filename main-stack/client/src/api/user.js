import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8888'

const client = axios.create({ baseURL: API_URL, withCredentials: true })

export async function getWishlist(){
    return client.get("/api/user/get-wishlist")
}

export default client;