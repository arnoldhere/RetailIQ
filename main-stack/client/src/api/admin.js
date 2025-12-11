import client from './auth'

export async function getOverview() {
  return client.get('/api/admin/overview')
}

export async function getUsers(){
  return client.get("/api/admin/get-users")
}

export async function getFeedbacks(){
  return client.get("/api/admin/get-feedbacks")
}

export async function getSuppliers(limit = 12, offset = 0, filters = {}) {
  return client.get('/api/admin/suppliers', {
    params: { limit, offset, ...filters }
  })
}

export async function getCustomerOrders(limit = 12, offset = 0, filters = {}) {
  const params = { limit, offset }
  if (filters.search) params.search = filters.search
  if (filters.status) params.status = filters.status
  if (filters.sort) params.sort = filters.sort
  if (filters.order) params.order = filters.order
  return client.get('/api/admin/customer-orders', { params })
}

export async function getSupplierOrders(limit = 12, offset = 0, filters = {}) {
  return client.get('/api/admin/supplier-orders', {
    params: { limit, offset, ...filters }
  })
}

export async function createSupplier(data) {
  return client.post('/api/admin/suppliers', data)
}

export async function sendAssuranceMail(id) {
  return client.post(`/api/admin/sendAssurance/${id}`)
}
