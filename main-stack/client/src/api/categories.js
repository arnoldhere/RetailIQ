import client from './auth'

export async function listCategories(limit = 100, offset = 0) {
  return client.get('/api/admin/categories', { params: { limit, offset } })
}

export async function createCategory(data) {
  return client.post('/api/admin/categories', data)
}

export async function updateCategory(id, data) {
  return client.put(`/api/admin/categories/${id}`, data)
}

export async function deleteCategory(id) {
  return client.delete(`/api/admin/categories/${id}`)
}

export default { listCategories, createCategory, updateCategory, deleteCategory }
