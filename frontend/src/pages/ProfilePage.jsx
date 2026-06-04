import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const [badges, setBadges]   = useState([])
  const [editing, setEditing] = useState(false)
  const [name, setName]       = useState(user?.name || '')
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')

  const level     = (user?.ecoPoints || 0) >= 500 ? 'Eco Master' : (user?.ecoPoints || 0) >= 200 ? 'Eco Warrior' : (user?.ecoPoints || 0) >= 50 ? 'Eco Starter' : 'Pemula'
  const levelEmoji= (user?.ecoPoints || 0) >= 500 ? '👑' : (user?.ecoPoints || 0) >= 200 ? '🥇' : (user?.ecoPoints || 0) >= 50 ? '🌱' : '🌿'

  useEffect(() => {
    api.get('/api/tips/badges')
      .then(r => setBadges(r.data.badges || []))
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const r = await api.put('/api/user/profile', { name: name.trim() })
      updateUser({ name: name.trim() })
      setMsg('Profil berhasil diperbarui! ✅')
      setEditing(false)
      setTimeout(() => setMsg(''), 3000)
    } catch (e) {
      setMsg('Gagal memperbarui profil')
    }
    setSaving(false)
  }

  const handleLogout = () => {
    if (confirm('Yakin ingin keluar dari EcoScan?')) logout()
  }

  return (
    <div className="p-4 space-y-4 pb-6">
      {/* Header profile */}
      <div className="rounded-3xl p-5 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #085041 0%, #1D9E75 100%)' }}>
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"/>
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-3xl shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex gap-2">
                <input value={name} onChange={e => setName(e.target.value)}
                  className="flex-1 bg-white/20 text-white placeholder-white/50 border border-white/30 rounded-lg px-2 py-1 text-sm outline-none"
                  placeholder="Nama lengkap"/>
                <button onClick={handleSave} disabled={saving}
                  className="bg-white text-eco-600 rounded-lg px-2 py-1 text-xs font-semibold">
                  {saving ? '...' : 'Simpan'}
                </button>
                <button onClick={() => setEditing(false)}
                  className="bg-white/20 text-white rounded-lg px-2 py-1 text-xs">Batal</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg text-white truncate">{user?.name}</h2>
                <button onClick={() => setEditing(true)} className="text-white/60 hover:text-white text-sm">✏️</button>
              </div>
            )}
            <p className="text-white/70 text-sm truncate">{user?.email}</p>
            <span className="inline-block mt-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
              {levelEmoji} {level}
            </span>
          </div>
        </div>
        {msg && <p className="mt-3 text-xs text-white/80 bg-white/10 rounded-lg px-3 py-2">{msg}</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Scan',  value: user?.totalScans || 0,  emoji: '📷' },
          { label: 'EcoPoints',   value: user?.ecoPoints || 0,    emoji: '⭐' },
          { label: 'CO₂ Hemat',   value: `${parseFloat((user?.carbonSaved||0).toFixed(1))}kg`, emoji: '🌿' },
        ].map((s, i) => (
          <div key={i} className="card p-3 text-center">
            <p className="text-xl mb-1">{s.emoji}</p>
            <p className="text-lg font-bold text-eco-700">{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">🏅 Badge Kamu</h3>
          <Link to="/tips" className="text-xs text-eco-600 font-medium">Lihat semua →</Link>
        </div>
        {badges.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-3xl mb-2">🏅</p>
            <p className="text-sm text-gray-400">Belum ada badge. Terus scan untuk dapat badge!</p>
            <Link to="/scan" className="inline-block mt-2 text-xs text-eco-600 font-medium">Scan sekarang →</Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {badges.map(b => (
              <div key={b.id} className="bg-eco-50 border border-eco-100 rounded-xl px-3 py-2 flex items-center gap-1.5">
                <span className="text-lg">{b.emoji}</span>
                <span className="text-xs font-medium text-eco-700">{b.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="card overflow-hidden">
        {[
          { icon: '🏆', label: 'Leaderboard & Poin', to: '/tips', note: `#${user?.rank || '?'} peringkatmu` },
          { icon: '💡', label: 'Tips & Tantangan',   to: '/tips', note: `${user?.ecoPoints || 0} pts` },
          { icon: '📊', label: 'Statistik Scan',     to: '/dashboard', note: `${user?.totalScans || 0} scan` },
        ].map((m, i) => (
          <Link key={i} to={m.to}
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50 last:border-0">
            <span className="text-xl w-8">{m.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">{m.label}</p>
              <p className="text-xs text-gray-400">{m.note}</p>
            </div>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </Link>
        ))}
      </div>

      {/* Info Akun */}
      <div className="card p-4">
        <h3 className="font-semibold text-gray-800 mb-3">ℹ️ Info Akun</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-700 truncate max-w-48">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Member sejak</span>
            <span className="font-medium text-gray-700">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Level</span>
            <span className="font-medium text-eco-600">{levelEmoji} {level}</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full py-3.5 rounded-xl font-semibold text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition-all active:scale-95">
        🚪 Keluar dari EcoScan
      </button>

      <p className="text-center text-xs text-gray-300 pb-2">
        EcoScan v3.0 · Coding Camp DBS Foundation 2026
      </p>
    </div>
  )
}
