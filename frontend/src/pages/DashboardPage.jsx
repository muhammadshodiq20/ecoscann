import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const WASTE_COLORS_MAP = {
  plastik: '#378ADD', organik: '#1D9E75', kertas: '#EF9F27',
  logam: '#888780', kaca: '#06B6D4', b3: '#E24B4A', elektronik: '#8B5CF6', tekstil: '#EC4899'
}
const WASTE_LABELS = {
  plastik: 'Plastik', organik: 'Organik', kertas: 'Kertas',
  logam: 'Logam', kaca: 'Kaca', b3: 'B3', elektronik: 'Elektronik', tekstil: 'Tekstil'
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/stats')
      .then(res => setStats(res.data))
      .catch(() => {
        setStats({
          wasteBreakdown: [
            { _id: 'plastik', count: 18, totalCarbon: 32.4 },
            { _id: 'organik', count: 12, totalCarbon: 3.6 },
            { _id: 'kertas', count: 9, totalCarbon: 8.1 },
            { _id: 'logam', count: 5, totalCarbon: 10.5 },
            { _id: 'b3', count: 3, totalCarbon: 10.5 }
          ],
          monthlyScan: 47, totalScans: 134,
          dailyScans: [
            { _id: '2026-04-18', count: 4 }, { _id: '2026-04-19', count: 7 },
            { _id: '2026-04-20', count: 3 }, { _id: '2026-04-21', count: 9 },
            { _id: '2026-04-22', count: 5 }, { _id: '2026-04-23', count: 6 },
            { _id: '2026-04-24', count: 8 }
          ],
          ecoPoints: user?.ecoPoints || 840, carbonSaved: user?.carbonSaved || 12.4
        })
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="p-4 space-y-4">
      {[1,2,3].map(i => <div key={i} className="card p-4 animate-pulse"><div className="h-32 bg-gray-50 rounded-xl"></div></div>)}
    </div>
  )

  const pieData = stats?.wasteBreakdown?.map(w => ({
    name: WASTE_LABELS[w._id] || w._id, value: w.count, color: WASTE_COLORS_MAP[w._id] || '#888780'
  })) || []

  const dailyData = stats?.dailyScans?.map(d => ({ day: d._id?.slice(5), scan: d.count })) || []
  const totalWaste = stats?.wasteBreakdown?.reduce((s, w) => s + w.count, 0) || 0

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Statistik</h2>
        <p className="text-sm text-gray-400">Pantau dampak lingkunganmu</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Scan', value: stats?.totalScans || 0, unit: 'scan', icon: '📊', color: 'bg-blue-50 border-blue-100' },
          { label: 'Bulan Ini', value: stats?.monthlyScan || 0, unit: 'scan', icon: '📅', color: 'bg-eco-50 border-eco-100' },
          { label: 'CO₂ Dihemat', value: (stats?.carbonSaved || 0).toFixed(1), unit: 'kg', icon: '🌍', color: 'bg-green-50 border-green-100' },
          { label: 'EcoPoints', value: stats?.ecoPoints || 0, unit: 'poin', icon: '⭐', color: 'bg-amber-50 border-amber-100' }
        ].map((item, i) => (
          <div key={i} className={`card p-4 border ${item.color}`}>
            <div className="text-xl mb-1">{item.icon}</div>
            <div className="text-2xl font-bold text-gray-800">{item.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{item.unit}</div>
            <div className="text-xs font-medium text-gray-500 mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      {pieData.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold text-gray-700 mb-4">Distribusi jenis sampah</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} scan`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }}></div>
                  <span className="text-xs text-gray-600 flex-1">{item.name}</span>
                  <span className="text-xs font-semibold text-gray-700">{totalWaste > 0 ? Math.round(item.value / totalWaste * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {dailyData.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold text-gray-700 mb-4">Scan 7 hari terakhir</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={dailyData} barSize={20}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip cursor={{ fill: '#E1F5EE' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} formatter={(v) => [v, 'scan']} />
              <Bar dataKey="scan" fill="#1D9E75" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats?.wasteBreakdown?.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold text-gray-700 mb-4">Dampak karbon per jenis</h3>
          <div className="space-y-3">
            {stats.wasteBreakdown.map((w, i) => {
              const maxCarbon = Math.max(...stats.wasteBreakdown.map(x => x.totalCarbon))
              const pct = maxCarbon > 0 ? (w.totalCarbon / maxCarbon * 100) : 0
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{WASTE_LABELS[w._id] || w._id}</span>
                    <span className="text-gray-400">{w.totalCarbon.toFixed(1)} kg CO₂</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: WASTE_COLORS_MAP[w._id] || '#888780' }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="card p-4 bg-gradient-to-r from-eco-500 to-eco-600 border-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
            {(stats?.totalScans || 0) >= 100 ? '🏆' : (stats?.totalScans || 0) >= 50 ? '🥈' : '🌱'}
          </div>
          <div>
            <p className="text-eco-100 text-xs">Level kamu</p>
            <p className="text-white font-bold">
              {(stats?.totalScans || 0) >= 100 ? 'Eco Champion' : (stats?.totalScans || 0) >= 50 ? 'Eco Warrior' : 'Eco Starter'}
            </p>
            <p className="text-eco-100 text-xs mt-0.5">
              {(stats?.totalScans || 0) >= 100 ? 'Luar biasa! Kamu sudah sangat berkontribusi!' : `${100 - (stats?.totalScans || 0)} scan lagi untuk jadi Eco Champion`}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
