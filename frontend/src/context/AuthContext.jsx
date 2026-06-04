import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ecoscan_token')
    if (token) {
      api.get('/api/auth/me')
        .then(res => {
          if (res.data?.user) {
            setUser(res.data.user)
          } else {
            localStorage.removeItem('ecoscan_token')
          }
        })
        .catch(() => {
          localStorage.removeItem('ecoscan_token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password })
      localStorage.setItem('ecoscan_token', res.data.token)
      setUser(res.data.user)
      return res.data
    } catch (err) {
      const msg = err.response?.data?.message || 'Login gagal. Coba lagi.'
      throw new Error(msg)
    }
  }

  const register = async (name, email, password) => {
    try {
      const res = await api.post('/api/auth/register', { name, email, password })
      localStorage.setItem('ecoscan_token', res.data.token)
      setUser(res.data.user)
      return res.data
    } catch (err) {
      const msg = err.response?.data?.message || 'Registrasi gagal. Coba lagi.'
      throw new Error(msg)
    }
  }

  const logout = () => {
    localStorage.removeItem('ecoscan_token')
    setUser(null)
    window.location.href = '/login'
  }

  const updateUser = (updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus digunakan di dalam AuthProvider')
  return ctx
}
