import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8888'

const client = axios.create({ baseURL: API_URL, withCredentials: true })

export async function getCart() {
  const response = await client.get('/api/cart')
  return response.data
}

export async function addToCart(productId, quantity = 1) {
  const response = await client.post('/api/cart/add', { productId, quantity })
  return response.data
}

export async function removeFromCart(cartItemId) {
  const response = await client.delete(`/api/cart/item/${cartItemId}`)
  return response.data
}

export async function updateCartItemQuantity(cartItemId, quantity) {
  const response = await client.put(`/api/cart/item/${cartItemId}`, { quantity })
  return response.data
}

export async function clearCart() {
  const response = await client.delete('/api/cart/clear')
  return response.data
}

export default client

