import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8888'

const client = axios.create({ baseURL: API_URL, withCredentials: true })

export async function getWishlist() {
  const response = await client.get('/api/wishlist')
  return response.data
}

export async function addToWishlist(productId) {
  const response = await client.post('/api/wishlist/add', { productId })
  return response.data
}

export async function removeFromWishlistById(wishlistItemId) {
  const response = await client.delete(`/api/wishlist/item/${wishlistItemId}`)
  return response.data
}

export async function removeFromWishlist(productId) {
  const response = await client.delete(`/api/wishlist/product/${productId}`)
  return response.data
}

export async function clearWishlist() {
  const response = await client.delete('/api/wishlist/clear')
  return response.data
}

export default client

