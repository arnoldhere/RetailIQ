import client from './auth'

export async function listProducts(limit = 100, offset = 0, filters = {}) {
  return client.get('/api/admin/products', {
    params: { limit, offset, ...filters }
  })
}

export async function createProduct(data) {
  return client.post('/api/admin/products', data)
}

export async function updateProduct(id, data) {
  return client.put(`/api/admin/products/${id}`, data)
}

export async function deleteProduct(id) {
  return client.delete(`/api/admin/products/${id}`)
}

export default { listProducts, createProduct, updateProduct, deleteProduct }
