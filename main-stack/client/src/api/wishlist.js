import client from './base'

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
