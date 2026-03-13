import client from './base'

export async function signup(body) {
  return client.post('/api/auth/signup', body)
}

export async function login(body) {
  return client.post('/api/auth/login', body)
}

export async function me() {
  return client.get('/api/auth/me')
}

export async function logout() {
  return client.post('/api/auth/logout')
}

export async function forgotPassword(body) {
  return client.post('/api/auth/forgot-password', body)
}

export async function verifyOTP(body) {
  return client.post('/api/auth/verify-otp', body)
}

export async function resetPassword(body) {
  return client.post('/api/auth/reset-password', body)
}

export default client
