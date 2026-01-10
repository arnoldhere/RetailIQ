import client from './auth'

export async function getAsks(limit=12, offset=0) {
  return client.get('/api/user/supplier/asks', { params: { limit, offset } })
}

export async function placeBid(askId, data) {
  return client.post(`/api/user/supplier/asks/${askId}/bids`, data)
}

export async function getSupplierBids() {
  return client.get('/api/user/supplier/bids')
}

export async function getAdminAsks(limit=12, offset=0) {
  return client.get('/api/admin/asks', { params: { limit, offset } })
}

export async function createAsk(data) {
  return client.post('/api/admin/asks', data)
}

export async function closeAsk(id) {
  return client.post(`/api/admin/asks/${id}/close`)
}

export async function adminListBids(ask_id) {
  return client.get('/api/admin/bids', { params: { ask_id } })
}

export async function acceptBid(id) {
  return client.post(`/api/admin/bids/${id}/accept`)
}

// Supplier supply orders
export async function placeSupplyOrder(data) {
  return client.post('/api/user/supplier/orders', data)
}

export async function getSupplierOrders(limit = 12, offset = 0) {
  return client.get('/api/user/supplier/orders', { params: { limit, offset } })
}
