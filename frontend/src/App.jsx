import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ScanPage from './pages/ScanPage'
import DashboardPage from './pages/DashboardPage'
import FoodStockPage from './pages/FoodStockPage'
import TipsPage from './pages/TipsPage'
import ProfilePage from './pages/ProfilePage'
import Layout from './components/Layout'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-eco-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-eco-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-eco-600 text-sm font-medium">Memuat EcoScan...</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/scan" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/scan" replace />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="scan" element={<ScanPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="food" element={<FoodStockPage />} />
            <Route path="tips" element={<TipsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
