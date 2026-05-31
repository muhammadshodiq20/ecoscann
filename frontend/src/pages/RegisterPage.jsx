import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    if (!form.name.trim() || form.name.length < 2) return 'Nama minimal 2 karakter.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Format email tidak valid.'
    if (form.password.length < 6) return 'Password minimal 6 karakter.'
    if (!/\d/.test(form.password)) return 'Password harus mengandung minimal 1 angka.'
    if (form.password !== form.confirmPassword) return 'Konfirmasi password tidak cocok.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    setError('')
    try {
      await register(form.name, form.email, form.password)
      navigate('/scan')
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal membuat akun. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = () => {
    const p = form.password
    if (!p) return null
    let score = 0
    if (p.length >= 6) score++
    if (p.length >= 10) score++
    if (/\d/.test(p)) score++
    if (/[A-Z]/.test(p)) score++
    if (/[^a-zA-Z0-9]/.test(p)) score++
    if (score <= 2) return { label: 'Lemah', color: 'bg-red-400', width: '33%' }
    if (score <= 3) return { label: 'Sedang', color: 'bg-yellow-400', width: '66%' }
    return { label: 'Kuat', color: 'bg-eco-500', width: '100%' }
  }

  const strength = passwordStrength()

  return (
    <div className="min-h-screen bg-gradient-to-br from-eco-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="absolute top-0 right-0 w-80 h-80 bg-eco-100 rounded-full -translate-y-40 translate-x-40 opacity-40 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-100 rounded-full translate-y-32 -translate-x-32 opacity-40 blur-3xl"></div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-eco-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4C16 4 8 10 8 18C8 22.4183 11.5817 26 16 26C20.4183 26 24 22.4183 24 18C24 10 16 4 16 4Z" fill="white" opacity="0.9"/>
              <path d="M16 12C16 12 11 16 11 20C11 22.7614 13.2386 25 16 25" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Buat Akun Baru</h1>
          <p className="text-gray-500 text-sm mt-1">Mulai perjalanan hidup ramah lingkungan</p>
        </div>

        <div className="card p-8 fade-in">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
              <input
                type="text"
                className="input-field"
                placeholder="Nama kamu"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="nama@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="Min. 6 karakter + angka"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                    }
                  </svg>
                </button>
              </div>
              {strength && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Kekuatan password</span>
                    <span className={strength.color === 'bg-eco-500' ? 'text-eco-600' : strength.color === 'bg-yellow-400' ? 'text-yellow-600' : 'text-red-500'}>{strength.label}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} rounded-full transition-all duration-300`} style={{ width: strength.width }}></div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Ulangi password"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                autoComplete="new-password"
              />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Password tidak cocok</p>
              )}
              {form.confirmPassword && form.password === form.confirmPassword && form.password && (
                <p className="text-xs text-eco-600 mt-1">✓ Password cocok</p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Membuat akun...</>
              ) : 'Buat Akun Gratis'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-eco-600 font-medium hover:text-eco-700">Masuk di sini</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
