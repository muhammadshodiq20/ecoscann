import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Component } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage   from './pages/LandingPage'
import LoginPage     from './pages/LoginPage'
import RegisterPage  from './pages/RegisterPage'
import ScanPage      from './pages/ScanPage'
import DashboardPage from './pages/DashboardPage'
import TipsPage      from './pages/TipsPage'
import ProfilePage   from './pages/ProfilePage'
import Layout        from './components/Layout'

function LoadingScreen() {
  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', flexDirection:'column', gap:'16px',
      background:'linear-gradient(135deg,#E1F5EE,#f8faf9)'
    }}>
      <div style={{ fontSize:'48px' }}>🌿</div>
      <div style={{
        width:'36px', height:'36px',
        border:'3px solid #1D9E75', borderTopColor:'transparent',
        borderRadius:'50%', animation:'spin 0.8s linear infinite'
      }}/>
      <p style={{ fontSize:'13px', color:'#1D9E75', fontWeight:'600' }}>Memuat EcoScan...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
        flexDirection:'column', gap:'16px', background:'#f8faf9', padding:'24px', textAlign:'center' }}>
        <div style={{ fontSize:'48px' }}>🌿</div>
        <h2 style={{ fontSize:'20px', fontWeight:'700', color:'#085041' }}>Ups, ada yang error</h2>
        <p style={{ fontSize:'14px', color:'#666', maxWidth:'280px' }}>Terjadi kesalahan. Coba refresh halaman.</p>
        <button onClick={() => window.location.href='/login'}
          style={{ background:'#1D9E75', color:'#fff', border:'none', padding:'12px 24px',
            borderRadius:'12px', fontSize:'14px', fontWeight:'600', cursor:'pointer' }}>
          Kembali ke Login
        </button>
      </div>
    )
    return this.props.children
  }
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/scan" replace />
  return children
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/"         element={<PublicRoute><LandingPage /></PublicRoute>} />
            <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/scan"      element={<ScanPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tips"      element={<TipsPage />} />
              <Route path="/profile"   element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}
