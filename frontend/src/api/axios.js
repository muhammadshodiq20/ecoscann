import axios from 'axios'

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  const hostname = window.location.hostname
  return `http://${hostname}:3002`
}

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 90000, // 90 detik — HuggingFace free tier cold start bisa 30-60 detik
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('ecoscan_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ecoscan_token')
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
