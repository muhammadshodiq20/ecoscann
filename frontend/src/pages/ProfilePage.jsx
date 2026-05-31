import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const [editMode, setEditMode] = useState(false)
  const [pwMode, setPwMode] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmNew: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSaveName = async () => {
    if (!name.trim() || name.length < 2) { setMsg({ type: 'error', text: 'Nama minimal 2 karakter.' }); return }
    setLoading(true); setMsg({ type: '', text: '' })
    try {
      const res = await api.put('/api/user/profile', { name })
      updateUser({ name: res.data.user.name })
      setEditMode(false)
      setMsg({ type: 'success', text: 'Nama berhasil diperbarui!' })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Gagal memperbarui nama.' })
    } finally { setLoading(false) }
  }

  const handleChangePw = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmNew) { setMsg({ type: 'error', text: 'Konfirmasi password baru tidak cocok.' }); return }
    if (pwForm.newPassword.length < 6) { setMsg({ type: 'error', text: 'Password baru minimal 6 karakter.' }); return }
    setLoading(true); setMsg({ type: '', text: '' })
    try {
      await api.put('/api/user/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      setPwForm({ currentPassword: '', newPassword: '', confirmNew: '' })
      setPwMode(false)
      setMsg({ type: 'success', text: 'Password berhasil diubah!' })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Gagal mengubah password.' })
    } finally { setLoading(false) }
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'EC'
  const level = (user?.totalScans || 0) >= 100 ? 'Eco Champion' : (user?.totalScans || 0) >= 50 ? 'Eco Warrior' : 'Eco Starter'
  const levelEmoji = (user?.totalScans || 0) >= 100 ? '🏆' : (user?.totalScans || 0) >= 50 ? '🥈' : '🌱'

  return (
    <div className="p-4 space-y-4">
      {/* Profile header */}
      <div className="card p-5 text-center">
        <div className="w-20 h-20 bg-eco-500 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-2xl font-bold">
          {initials}
        </div>
        {editMode ? (
          <div className="flex gap-2 max-w-xs mx-auto mb-2">
            <input className="input-field text-center text-sm" value={name} onChange={e => setName(e.target.value)} placeholder="Nama kamu" />
            <button onClick={handleSaveName} disabled={loading} className="btn-primary px-3 py-2 text-sm shrink-0">
              {loading ? '...' : '✓'}
            </button>
            <button onClick={() => { setEditMode(false); setName(user?.name || '') }} className="btn-secondary px-3 py-2 text-sm shrink-0">✕</button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-gray-800">{user?.name}</h2>
            <button onClick={() => setEditMode(true)} className="text-gray-400 hover:text-eco-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
          </div>
        )}
        <p className="text-sm text-gray-400">{user?.email}</p>
        <div className="flex items-center justify-center gap-1 mt-2">
          <span className="text-lg">{levelEmoji}</span>
          <span className="text-sm font-medium text-eco-600">{level}</span>
        </div>

        {msg.text && (
          <div className={`mt-3 text-xs px-3 py-2 rounded-lg ${msg.type === 'success' ? 'bg-eco-50 text-eco-700' : 'bg-red-50 text-red-600'}`}>
            {msg.text}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total Scan', val: user?.totalScans || 0, icon: '📊' },
          { label: 'EcoPoints', val: user?.ecoPoints || 0, icon: '⭐' },
          { label: 'CO₂ Dihemat', val: `${(user?.carbonSaved || 0).toFixed(1)}kg`, icon: '🌍' }
        ].map((s, i) => (
          <div key={i} className="card p-3 text-center">
            <p className="text-lg">{s.icon}</p>
            <p className="text-lg font-bold text-gray-800 mt-0.5">{s.val}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="card p-4">
        <h3 className="font-semibold text-gray-700 mb-3">Badge Kamu</h3>
        {user?.badges?.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {user.badges.map((badge, i) => (
              <span key={i} className="px-3 py-1 bg-eco-50 text-eco-700 text-xs rounded-full font-medium border border-eco-100">{badge}</span>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-2xl mb-1">🎖️</p>
            <p className="text-xs text-gray-400">Belum ada badge. Terus scan untuk dapatkan badge pertamamu!</p>
          </div>
        )}
      </div>

      {/* Ganti password */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700">Keamanan Akun</h3>
          <button onClick={() => { setPwMode(!pwMode); setMsg({ type: '', text: '' }) }}
            className="text-xs text-eco-600 font-medium hover:underline">
            {pwMode ? 'Batal' : 'Ganti Password'}
          </button>
        </div>
        {pwMode && (
          <form onSubmit={handleChangePw} className="space-y-3 fade-in">
            <input type="password" className="input-field" placeholder="Password lama" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
            <input type="password" className="input-field" placeholder="Password baru (min. 6 + angka)" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} />
            <input type="password" className="input-field" placeholder="Konfirmasi password baru" value={pwForm.confirmNew} onChange={e => setPwForm({ ...pwForm, confirmNew: e.target.value })} />
            <button type="submit" disabled={loading} className="btn-primary w-full text-sm py-2">
              {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
          </form>
        )}
        {!pwMode && (
          <p className="text-xs text-gray-400">Password terakhir diubah saat pembuatan akun. Disarankan ganti password secara berkala.</p>
        )}
      </div>

      {/* Info akun */}
      <div className="card p-4">
        <h3 className="font-semibold text-gray-700 mb-3">Info Akun</h3>
        <div className="space-y-2">
          {[
            { label: 'Email', val: user?.email },
            { label: 'Bergabung', val: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-' },
            { label: 'Login terakhir', val: user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' }) : '-' }
          ].map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-400">{item.label}</span>
              <span className="text-gray-700 font-medium">{item.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3 px-4 rounded-xl border border-red-200 text-red-500 font-medium text-sm hover:bg-red-50 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
        Keluar dari Akun
      </button>

      <p className="text-center text-xs text-gray-300 pb-2">EcoScan v1.0.0 · Dibuat dengan 💚 untuk bumi</p>
    </div>
  )
}
