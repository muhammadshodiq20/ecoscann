import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import api from '../api/axios'

const WASTE_COLORS = {
  plastik:'#378ADD', organik:'#1D9E75', kertas:'#EF9F27',
  logam:'#888780', kaca:'#2DD4BF', b3:'#E24B4A',
  elektronik:'#8B5CF6', tekstil:'#EC4899'
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats]   = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/api/stats').catch(() => ({ data: {} })),
      api.get('/api/scan/history?limit=5').catch(() => ({ data: { scans: [] } }))
    ]).then(([sRes, hRes]) => {
      setStats(sRes.data)
      setHistory(hRes.data.scans || [])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchStats()
    // Refresh data setiap kali halaman menjadi aktif (misal setelah balik dari scan)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchStats()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [fetchStats])

  // wasteBreakdown dari backend adalah array: [{ _id: 'plastik', count: 3 }, ...]
  // Konversi ke object agar bisa dipakai di UI
  const wasteBreakdown = (() => {
    const raw = stats?.wasteBreakdown
    if (!raw) return {}
    if (Array.isArray(raw)) {
      return raw.reduce((acc, item) => {
        if (item._id) acc[item._id] = item.count
        return acc
      }, {})
    }
    return raw // sudah berbentuk object
  })()
  const totalScans     = user?.totalScans || stats?.totalScans || 0
  const ecoPoints      = user?.ecoPoints  || 0
  const carbonSaved    = parseFloat((user?.carbonSaved || 0).toFixed(1))
  const level          = ecoPoints >= 500 ? 'Eco Master' : ecoPoints >= 200 ? 'Eco Warrior' : ecoPoints >= 50 ? 'Eco Starter' : 'Pemula'
  const nextLevel      = ecoPoints >= 500 ? 500 : ecoPoints >= 200 ? 500 : ecoPoints >= 50 ? 200 : 50
  const progress       = Math.min((ecoPoints / nextLevel) * 100, 100)

  const days = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']

  // Bangun weeklyData dari dailyScans backend (7 hari terakhir sesuai hari kalender)
  const weeklyData = (() => {
    const result = Array(7).fill(0)
    const dailyScans = stats?.dailyScans || []
    if (dailyScans.length > 0) {
      const today = new Date()
      dailyScans.forEach(({ _id, count }) => {
        const scanDate = new Date(_id)
        // Hitung berapa hari lalu dari hari ini
        const diffDays = Math.round((today - scanDate) / (1000 * 60 * 60 * 24))
        if (diffDays >= 0 && diffDays < 7) {
          // Index: hari ini = indeks hari ini dalam minggu, mundur ke belakang
          const todayIdx = today.getDay()   // 0=Min … 6=Sab
          let idx = todayIdx - diffDays
          if (idx < 0) idx += 7
          result[idx] = count
        }
      })
    }
    return result
  })()
  const maxVal = Math.max(...weeklyData, 1)

  return (
    <div className="p-4 space-y-4 pb-6">
      {/* Header dengan gradient */}
      <div className="rounded-3xl p-5 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #085041 0%, #1D9E75 60%, #2DD4BF 100%)' }}>
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"/>
        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full"/>
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/70 text-sm">Selamat datang, 👋</p>
              <h2 className="text-xl font-bold">{user?.name || 'EcoWarrior'}</h2>
              <span className="inline-block mt-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                🏆 {level}
              </span>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-xs">EcoPoints</p>
              <p className="text-3xl font-bold">⭐ {ecoPoints}</p>
            </div>
          </div>

          {/* Progress bar level */}
          <div>
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <span>{ecoPoints} pts</span>
              <span>Target: {nextLevel} pts</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }}/>
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Scan', value: totalScans, emoji: '📷', color: '#E6F1FB', textColor: '#0C447C' },
          { label: 'CO₂ Hemat', value: `${carbonSaved}kg`, emoji: '🌿', color: '#E1F5EE', textColor: '#085041' },
          { label: 'EcoPoints', value: ecoPoints, emoji: '⭐', color: '#FAEEDA', textColor: '#633806' },
        ].map((k, i) => (
          <div key={i} className="rounded-2xl p-3 text-center" style={{ background: k.color }}>
            <p className="text-2xl mb-1">{k.emoji}</p>
            <p className="text-lg font-bold" style={{ color: k.textColor }}>{k.value}</p>
            <p className="text-xs" style={{ color: k.textColor, opacity: 0.7 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Aktivitas mingguan */}
      <div className="card p-4">
        <h3 className="font-semibold text-gray-800 mb-3">📊 Aktivitas 7 Hari Terakhir</h3>
        {loading ? (
          <div className="h-24 bg-gray-50 rounded-xl animate-pulse"/>
        ) : (
          <div className="flex items-end gap-1.5 h-24">
            {weeklyData.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-lg transition-all"
                  style={{
                    height: `${(val / maxVal) * 80}px`,
                    minHeight: val > 0 ? '8px' : '2px',
                    background: val > 0
                      ? 'linear-gradient(180deg, #1D9E75, #085041)'
                      : '#f3f4f6'
                  }}/>
                <span className="text-xs text-gray-400">{days[i]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {Object.keys(wasteBreakdown).length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold text-gray-800 mb-3">♻️ Distribusi Jenis Sampah</h3>
          <div className="space-y-2">
            {(() => {
              const entries = Object.entries(wasteBreakdown).sort((a,b) => b[1] - a[1]).slice(0, 5)
              const total = entries.reduce((s, [,c]) => s + c, 0) || 1
              return entries.map(([type, count]) => {
                const pct = Math.round((count / total) * 100)
                return (
                  <div key={type} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 capitalize w-20 shrink-0">{type}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: WASTE_COLORS[type] || '#888' }}/>
                    </div>
                    <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      )}

      {/* Riwayat scan terbaru */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">🕐 Riwayat Scan</h3>
          <Link to="/scan" className="text-xs text-eco-600 font-medium">Scan baru →</Link>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse"/>)}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-3xl mb-2">📷</p>
            <p className="text-sm text-gray-400">Belum ada riwayat scan</p>
            <Link to="/scan" className="inline-block mt-2 text-sm text-eco-600 font-medium">Mulai scan sekarang →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((scan, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                  style={{ background: WASTE_COLORS[scan.wasteType] + '20' }}>
                  <span style={{ color: WASTE_COLORS[scan.wasteType] || '#888' }}>♻️</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 capitalize">{scan.wasteType}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(scan.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-eco-600">+20 pts</p>
                  <p className="text-xs text-gray-400">{((scan.confidence || 0) * 100).toFixed(0)}%</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick action */}
      <Link to="/scan"
        className="block w-full py-4 rounded-2xl text-center font-semibold text-white transition-all active:scale-95"
        style={{ background: 'linear-gradient(135deg, #085041, #1D9E75)' }}>
        📷 Scan Sampah Sekarang
      </Link>
    </div>
  )
}
