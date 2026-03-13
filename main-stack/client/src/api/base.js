import axios from 'axios'

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'http://localhost:8888'

export const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

export function buildApiUrl(path = '') {
  if (!path) return API_BASE_URL
  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function resolveMediaUrl(path) {
  if (!path) return ''
  if (/^(https?:\/\/|data:|blob:)/i.test(path)) return path
  return buildApiUrl(path)
}

export default client
