import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8888'

const client = axios.create({ baseURL: API_URL, withCredentials: true })

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
