import client from './auth'

export async function listProducts(limit = 100, offset = 0, filters = {}) {
  return client.get('/api/admin/products', {
    params: { limit, offset, ...filters }
  })
}

export async function createProduct(data) {
  return client.post('/api/admin/products', data)
}

export async function getCategories(limit = 100, offset = 0, filters = {}) {
  return client.get('/api/user/get-product-categories', {
    params: { limit, offset, ...filters }
  })
}

export async function updateProduct(id, data) {
  return client.put(`/api/admin/products/${id}`, data)
}

export async function deleteProduct(id) {
  return client.delete(`/api/admin/products/${id}`)
}

// Customer product endpoints (public - no auth required)
export async function getPublicProducts(limit = 100, offset = 0, filters = {}) {
  const params = new URLSearchParams()
  params.append('limit', limit)
  params.append('offset', offset)
  if (filters.category_id) params.append('category_id', filters.category_id)
  if (filters.search) params.append('search', filters.search)
  if (filters.sort) params.append('sort', filters.sort)
  if (filters.order) params.append('order', filters.order)

  return fetch(`http://localhost:8888/api/products?${params}`, {
    credentials: 'include',
  }).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch products')
    return res.json()
  })
}

export async function getProductById(id) {
  return fetch(`http://localhost:8888/api/products/${id}`, {
    credentials: 'include',
  }).then((res) => {
    if (!res.ok) throw new Error('Product not found')
    return res.json()
  })
}

export default { listProducts, createProduct, updateProduct, deleteProduct, getPublicProducts, getProductById }
