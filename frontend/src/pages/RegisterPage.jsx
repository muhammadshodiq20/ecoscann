import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]     = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const strength = (p) => {
    if (!p) return { level: 0, label: '', color: '' }
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    const map = [
      { level: 0, label: '', color: '' },
      { level: 1, label: 'Lemah', color: '#E24B4A' },
      { level: 2, label: 'Sedang', color: '#EF9F27' },
      { level: 3, label: 'Kuat', color: '#1D9E75' },
      { level: 4, label: 'Sangat Kuat', color: '#085041' },
    ]
    return map[s]
  }

  const pwdStrength = strength(form.password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) { setError('Semua field wajib diisi'); return }
    if (form.password.length < 6) { setError('Password minimal 6 karakter'); return }
    if (form.password !== form.confirm) { setError('Password tidak cocok'); return }
    setLoading(true); setError('')
    try {
      await register(form.name, form.email, form.password)
      navigate('/scan', { replace: true })
    } catch (err) {
      setError(err.message || 'Gagal membuat akun. Coba lagi.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{
      background: 'linear-gradient(135deg, #085041 0%, #1D9E75 50%, #2DD4BF 100%)'
    }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full"/>
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/5 rounded-full"/>
      </div>

      <div className="relative p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Kembali
        </Link>
      </div>

      <div className="relative flex-1 flex items-center justify-center p-4 pb-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30">
              <span className="text-3xl">🌱</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Buat Akun Baru</h1>
            <p className="text-white/70 text-sm mt-1">Mulai perjalanan hidup ramah lingkungan</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
                <span className="text-sm">❌</span>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
                <input type="text" placeholder="Muhammad Shodiq" autoComplete="name"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-eco-400 focus:ring-2 focus:ring-eco-100 outline-none text-sm transition-all bg-gray-50 focus:bg-white"/>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" placeholder="nama@email.com" autoComplete="email"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-eco-400 focus:ring-2 focus:ring-eco-100 outline-none text-sm transition-all bg-gray-50 focus:bg-white"/>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} placeholder="Min. 6 karakter"
                    autoComplete="new-password"
                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-eco-400 focus:ring-2 focus:ring-eco-100 outline-none text-sm transition-all bg-gray-50 focus:bg-white pr-12"/>
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
                          style={{ background: i <= pwdStrength.level ? pwdStrength.color : '#e5e7eb' }}/>
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: pwdStrength.color }}>
                      Kekuatan password: {pwdStrength.label}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password</label>
                <input type="password" placeholder="Ulangi password" autoComplete="new-password"
                  value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-eco-400 focus:ring-2 focus:ring-eco-100 outline-none text-sm transition-all bg-gray-50 focus:bg-white"/>
                {form.confirm && (
                  <p className={`text-xs mt-1 ${form.password === form.confirm ? 'text-eco-600' : 'text-red-500'}`}>
                    {form.password === form.confirm ? '✓ Password cocok' : '✗ Password tidak cocok'}
                  </p>
                )}
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
                    Membuat akun...
                  </span>
                ) : 'Buat Akun Gratis'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-5">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-eco-600 font-semibold hover:text-eco-700">Masuk</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
