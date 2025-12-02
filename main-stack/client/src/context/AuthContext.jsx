import React, { createContext, useContext, useEffect, useState } from 'react'
import * as api from '../api/auth'

const AuthContext = createContext(null)

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
        if (mounted) setUser(res?.data?.user ?? null)
      } catch (err) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    init()
    return () => (mounted = false)
  }, [])

  async function doSignup(payload) {
    const res = await api.signup(payload)
    setUser(res?.data?.user ?? null)
    return res
  }

  async function doLogin(payload) {
    const res = await api.login(payload)
    setUser(res?.data?.user ?? null)
    return res
  }

  async function doLogout() {
    await api.logout()
    setUser(null)
  }

  const value = { user, loading, signup: doSignup, login: doLogin, logout: doLogout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
