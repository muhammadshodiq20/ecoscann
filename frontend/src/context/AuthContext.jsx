import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Cek token saat app pertama dibuka
  useEffect(() => {
    const token = localStorage.getItem('ecoscan_token')
    if (token) {
      api.get('/api/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => localStorage.removeItem('ecoscan_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('ecoscan_token', res.data.token)
    setUser(res.data.user)
    return res.data
  }

  const register = async (name, email, password) => {
    const res = await api.post('/api/auth/register', { name, email, password })
    localStorage.setItem('ecoscan_token', res.data.token)
    setUser(res.data.user)
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('ecoscan_token')
    setUser(null)
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
