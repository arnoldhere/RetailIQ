import client from './auth'

export async function getOverview() {
  return client.get('/api/admin/overview')
}

export async function getAnalytics(params = {}) {
  return client.get('/api/admin/analytics', { params })
}

export async function getProducts() {
  return client.get("/api/admin/products")
}

export async function getUsers() {
  return client.get("/api/admin/get-users")
}

export async function exportReport(report, format = 'csv', interval = 'month') {
  return client.get('/api/admin/export', {
    params: { report, format, interval },
    responseType: 'blob',
  })
}

// export async function getFeedbacks(){
//   return client.get("/api/admin/get-feedbacks")
// }

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

export async function getCustomerOrderDetails(id) {
  return client.get(`/api/admin/customer-orders/${id}`)
}

export async function updateOrderStatus(id, status) {
  return client.post(`/api/admin/customer-orders/${id}/status`, { status })
}

export async function getSupplierOrders(limit = 12, offset = 0, filters = {}) {
  return client.get('/api/admin/supplier-orders', {
    params: { limit, offset, ...filters }
  })
}

export async function createSupplier(data) {
  return client.post('/api/admin/suppliers', data)
}

export async function updateSupplier(id, data) {
  return client.put(`/api/admin/suppliers/${id}`, data)
}

export async function deleteSupplier(id) {
  return client.delete(`/api/admin/suppliers/${id}`)
}

export async function sendAssuranceMail(id) {
  return client.post(`/api/admin/sendAssurance/${id}`)
}

export async function deactivateUser(id) {
  return client.post(`/api/admin/users/${id}/deactivate`)
}

export async function reactivateUser(id) {
  return client.post(`/api/admin/users/${id}/reactivate`)
}

export async function getFeedbacks(limit = 12, offset = 0, filters = {}) {
  const params = { limit, offset }
  if (filters.search) params.search = filters.search
  if (filters.sort) params.sort = filters.sort
  if (filters.order) params.order = filters.order
  return client.get('/api/admin/get-feedbacks', { params })
}

// Stores API
export async function getStores(limit = 12, offset = 0, filters = {}) {
  const params = { limit, offset }
  if (filters.search) params.search = filters.search
  if (filters.is_active !== undefined) params.is_active = filters.is_active
  if (filters.sort) params.sort = filters.sort
  if (filters.order) params.order = filters.order
  return client.get('/api/admin/stores', { params })
}

export async function getStoreDetails(id) {
  return client.get(`/api/admin/stores/${id}`)
}

export async function createStore(data) {
  return client.post('/api/admin/stores', data)
}

export async function updateStore(id, data) {
  return client.put(`/api/admin/stores/${id}`, data)
}

export async function deleteStore(id) {
  return client.delete(`/api/admin/stores/${id}`)
}

// Store managers
export async function getStoreManagers(limit = 12, offset = 0, filters = {}) {
  const params = { limit, offset };
  if (filters.search) params.search = filters.search;
  if (filters.sort) params.sort = filters.sort;
  if (filters.order) params.order = filters.order;
  return client.get('/api/admin/store-managers', { params });
}

export async function getStoreManagersSimple(activeOnly = false) {
  return client.get('/api/admin/store-managers/simple', { params: { active: activeOnly ? '1' : '0' } });
}

export async function createStoreManager(data) {
  return client.post('/api/admin/store-managers', data);
}

export async function updateStoreManager(id, data) {
  return client.put(`/api/admin/store-managers/${id}`, data);
}

export async function deleteStoreManager(id) {
  return client.delete(`/api/admin/store-managers/${id}`);
}

// Supply order payments
export async function getSupplyPayments(orderId) {
  return client.get(`/api/admin/supplier-orders/${orderId}/payments`)
}

export async function recordSupplyPayment(orderId, data) {
  return client.post(`/api/admin/supplier-orders/${orderId}/payments`, data)
}

export async function getSupplyPaymentSummary(orderId) {
  return client.get(`/api/admin/supplier-orders/${orderId}/payment-summary`)
}

export async function notifySupplierIncompletePayment(orderId) {
  return client.post(`/api/admin/supplier-orders/${orderId}/notify-payment`)
}

export async function updateSupplyOrderStatus(orderId, status) {
  return client.post(`/api/admin/supplier-orders/${orderId}/status`, { status })
}

// Enhanced Financial Analytics APIs
export async function getFinancialMetrics(params = {}) {
  return client.get('/api/admin/financial/metrics', { params })
}

export async function getYoyComparison(params = {}) {
  return client.get('/api/admin/financial/yoy-comparison', { params })
}

export async function getFinancialAnomalies(params = {}) {
  return client.get('/api/admin/financial/anomalies', { params })
}

export async function getProfitWaterfall(params = {}) {
  return client.get('/api/admin/financial/profit-waterfall', { params })
}

export async function getExpenseBreakdown(params = {}) {
  return client.get('/api/admin/financial/expenses-breakdown', { params })
}
