import React, { createContext, useContext, useEffect, useState } from 'react'
import * as api from '../api/auth'

const AuthContext = createContext(null)

// Helper function to get cookie value
function getCookie(name) {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

// Helper function to save auth data to localStorage
function saveAuthToLocalStorage(user, token) {
  if (typeof window === 'undefined') return
  try {
    if (user) {
      localStorage.setItem('retailiq_user_id', String(user.id || ''))
      localStorage.setItem('retailiq_user_role', String(user.role || ''))
    }
    if (token) {
      localStorage.setItem('retailiq_token', token)
    }
  } catch (err) {
    console.error('Failed to save auth data to localStorage:', err)
  }
}

// Helper function to clear auth data from localStorage
function clearAuthFromLocalStorage() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('retailiq_user_id')
    localStorage.removeItem('retailiq_user_role')
    localStorage.removeItem('retailiq_token')
  } catch (err) {
    console.error('Failed to clear auth data from localStorage:', err)
  }
}

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function init() {
      try {
        const res = await api.me()
        if (mounted && res?.data?.user) {
          const userData = res.data.user
          setUser(userData)
          // Try to get token from cookie or use stored token
          const token = getCookie('retailiq_token') || localStorage.getItem('retailiq_token')
          saveAuthToLocalStorage(userData, token)
        } else {
          setUser(null)
          clearAuthFromLocalStorage()
        }
      } catch (err) {
        setUser(null)
        clearAuthFromLocalStorage()
      } finally {
        setLoading(false)
      }
    }
    init()
    return () => (mounted = false)
  }, [])

  async function doSignup(payload) {
    const res = await api.signup(payload)
    const userData = res?.data?.user ?? null
    setUser(userData)
    if (userData) {
      // Try to get token from response or cookie
      const token = res?.data?.token || getCookie('retailiq_token') || localStorage.getItem('retailiq_token')
      saveAuthToLocalStorage(userData, token)
    }
    return res
  }

  async function doLogin(payload) {
    const res = await api.login(payload)
    const userData = res?.data?.user ?? null
    setUser(userData)
    if (userData) {
      // Try to get token from response or cookie
      const token = res?.data?.token || getCookie('retailiq_token') || localStorage.getItem('retailiq_token')
      saveAuthToLocalStorage(userData, token)
    }
    return res
  }

  async function doLogout() {
    await api.logout()
    setUser(null)
    clearAuthFromLocalStorage()
  }

  const value = { user, loading, signup: doSignup, login: doLogin, logout: doLogout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
