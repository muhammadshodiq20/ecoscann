import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
<<<<<<< HEAD

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
=======

<<<<<<< HEAD
// Error boundary global — tangkap error yang tidak terduga
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('EcoScan Error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexDirection: 'column', gap: '16px',
          background: '#f8faf9', padding: '24px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px' }}>🌿</div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#085041' }}>
            Ups, ada yang error
          </h2>
          <p style={{ fontSize: '14px', color: '#666', maxWidth: '280px' }}>
            Terjadi kesalahan tidak terduga. Coba refresh halaman.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            style={{
              background: '#1D9E75', color: '#fff', border: 'none',
              padding: '12px 24px', borderRadius: '12px', fontSize: '14px',
              fontWeight: '600', cursor: 'pointer'
            }}
          >
            Kembali ke Login
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
=======
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
>>>>>>> 871d937 (feat: landing page, leaderboard, tips selesai, badge, sertifikat)
>>>>>>> 9aff2de
)
