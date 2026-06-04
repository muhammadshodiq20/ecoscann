import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Email dan password wajib diisi'); return }
    setLoading(true); setError('')
    try {
      await login(form.email, form.password)
      navigate('/scan', { replace: true })
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa email dan password.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{
      background: 'linear-gradient(135deg, #085041 0%, #1D9E75 50%, #2DD4BF 100%)'
    }}>
      {/* Decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full"/>
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/5 rounded-full"/>
        <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-white/5 rounded-full"/>
      </div>

      {/* Back to landing */}
      <div className="relative p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Kembali
        </Link>
      </div>

      <div className="relative flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30">
              <span className="text-3xl">🌿</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Selamat Datang</h1>
            <p className="text-white/70 text-sm mt-1">Masuk ke akun EcoScan kamu</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
                <span className="text-red-500 text-sm mt-0.5">⚠️</span>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email" autoComplete="email"
                  placeholder="nama@email.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-eco-400 focus:ring-2 focus:ring-eco-100 outline-none text-sm transition-all bg-gray-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-eco-400 focus:ring-2 focus:ring-eco-100 outline-none text-sm transition-all bg-gray-50 focus:bg-white pr-12"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1">
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #085041, #1D9E75)' }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Masuk...
                  </span>
                ) : 'Masuk ke EcoScan'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-5">
              Belum punya akun?{' '}
              <Link to="/register" className="text-eco-600 font-semibold hover:text-eco-700">
                Daftar sekarang
              </Link>
            </p>
          </div>

          <p className="text-center text-white/50 text-xs mt-6">
            🌍 Bergabung dengan ribuan pengguna yang sudah ramah lingkungan
          </p>
        </div>
      </div>
    </div>
  )
}
