import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const TIPS = [
  { id: 1, category: 'plastik',       emoji: '♻️', title: 'Daur ulang botol plastik PET',           body: 'Botol plastik kode PET (1) adalah yang paling mudah didaur ulang. Cuci bersih, lepas tutup dan label, lalu kumpulkan di bank sampah. 1 kg botol plastik dapat dihemat menjadi serat pakaian daur ulang.', points: 50,  tag: 'Plastik' },
  { id: 2, category: 'organik',       emoji: '🌱', title: 'Kompos rumahan dalam 30 hari',            body: 'Sisa kulit buah, sayur, dan ampas kopi bisa jadi kompos dalam 30 hari. Siapkan ember berlubang, campurkan bahan organik dengan daun kering 1:1, aduk tiap 3 hari. Gratis pupuk berkualitas!', points: 75, tag: 'Organik' },
  { id: 3, category: 'energi',        emoji: '💡', title: 'Matikan perangkat yang tidak dipakai',    body: 'Mode standby TV dan charger yang masih tancap tetap mengonsumsi listrik hingga 10% dari tagihan bulanan. Cabut charger dan matikan stop kontak saat tidak dipakai.', points: 30, tag: 'Energi' },
  { id: 4, category: 'air',           emoji: '💧', title: 'Hemat air saat menyikat gigi',            body: 'Mematikan keran saat gosok gigi bisa hemat hingga 8 liter per menit. Gunakan gelas untuk berkumur. Kebiasaan kecil ini menghemat ratusan liter air per bulan!', points: 25, tag: 'Air' },
  { id: 5, category: 'belanja',       emoji: '🛍️', title: 'Bawa tas belanja sendiri',               body: 'Satu kantong plastik butuh 500 tahun untuk terurai. Biasakan bawa tas kain saat belanja. Pilih tas kanvas atau tas anyaman yang bisa dipakai ratusan kali.', points: 40, tag: 'Belanja' },
  { id: 6, category: 'makanan',       emoji: '🍱', title: 'Meal prep mingguan kurangi food waste',   body: 'Rencanakan menu seminggu ke depan, belanja sesuai kebutuhan, dan masak dalam porsi besar lalu simpan. Cara ini terbukti mengurangi food waste hingga 40% dan hemat pengeluaran.', points: 60, tag: 'Makanan' },
  { id: 7, category: 'transportasi',  emoji: '🚲', title: 'Ganti perjalanan pendek dengan jalan kaki', body: 'Perjalanan di bawah 2 km dengan motor menghasilkan lebih banyak emisi karena mesin belum optimal. Ganti dengan jalan kaki atau sepeda — lebih sehat dan ramah lingkungan.', points: 45, tag: 'Transportasi' },
  { id: 8, category: 'elektronik',    emoji: '📱', title: 'Perbaiki dulu sebelum beli baru',        body: 'Produksi 1 smartphone menghasilkan ~70 kg CO₂. Sebelum ganti HP, coba perbaiki dulu — baterai bisa diganti, layar bisa diperbaiki. Satu keputusan perbaiki = setara tanam 3 pohon.', points: 80, tag: 'Elektronik' },
]

const CHALLENGES = [
  { id: 1, title: '7 Hari Tanpa Plastik Sekali Pakai', reward: 200, duration: '7 hari', icon: '🏆', active: true, desc: 'Hindari penggunaan kantong plastik, sedotan, dan kemasan sekali pakai selama 7 hari penuh.' },
  { id: 2, title: 'Scan 10 Sampah Minggu Ini',         reward: 100, duration: '7 hari', icon: '🔍', active: true, desc: 'Scan minimal 10 sampah berbeda menggunakan kamera EcoScan dalam 7 hari.' },
  { id: 3, title: 'Kompos Pertamamu',                   reward: 150, duration: '30 hari', icon: '🌱', active: false, desc: 'Mulai membuat kompos dari sampah organik rumah tangga selama 30 hari.' },
  { id: 4, title: '30 Hari Zero Food Waste',            reward: 300, duration: '30 hari', icon: '🎯', active: false, desc: 'Tidak membuang makanan sama sekali selama 30 hari. Rencanakan menu dengan matang!' },
]

const CATS = ['Semua', 'Plastik', 'Organik', 'Energi', 'Air', 'Belanja', 'Makanan', 'Transportasi', 'Elektronik']

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [])
  if (!msg) return null
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 fade-in
      ${type === 'success' ? 'bg-eco-500 text-white' : 'bg-red-500 text-white'}`}>
      {type === 'success' ? '🎉' : '⚠️'} {msg}
    </div>
  )
}

export default function TipsPage() {
  const { user, updateUser } = useAuth()
  const [filter, setFilter]       = useState('Semua')
  const [savedTips, setSavedTips] = useState([])
  const [activeTab, setActiveTab] = useState('tips')
  const [completedTips, setCompletedTips]   = useState([])
  const [completedChallenges, setCompletedChallenges] = useState([])
  const [badges, setBadges]   = useState([])
  const [allBadges, setAllBadges] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [myRank, setMyRank]   = useState(null)
  const [lbPeriod, setLbPeriod] = useState('alltime')
  const [toast, setToast]     = useState({ msg: '', type: '' })
  const [loading, setLoading] = useState({})
  const [lbLoading, setLbLoading] = useState(false)
  const [showCertModal, setShowCertModal] = useState(false)
  const [certData, setCertData] = useState(null)

  // Load data awal
  useEffect(() => {
    // Load badges
    api.get('/api/tips/badges').then(r => {
      setBadges(r.data.badges || [])
      setAllBadges(r.data.allBadges || [])
    }).catch(() => {})

    // Load leaderboard
    loadLeaderboard('alltime')

    // Ambil completedTips & completedChallenges dari user (via auth/me)
    api.get('/api/auth/me').then(r => {
      setCompletedTips(r.data.user?.completedTips || [])
      setCompletedChallenges(r.data.user?.completedChallenges || [])
    }).catch(() => {})
  }, [])

  const loadLeaderboard = async (period) => {
    setLbLoading(true)
    try {
      const r = await api.get(`/api/tips/leaderboard?period=${period}`)
      setLeaderboard(r.data.leaderboard || [])
      setMyRank(r.data.myRank)
    } catch {}
    setLbLoading(false)
  }

  const handleCompleteTip = async (tip) => {
    if (completedTips.includes(tip.id)) {
      setToast({ msg: 'Kamu sudah menyelesaikan tips ini!', type: 'info' }); return
    }
    setLoading(prev => ({ ...prev, [`tip_${tip.id}`]: true }))
    try {
      const r = await api.post('/api/tips/complete', { tipId: tip.id, points: tip.points })
      setCompletedTips(r.data.completedTips || [...completedTips, tip.id])
      updateUser({ ecoPoints: r.data.ecoPoints })
      if (r.data.newBadges?.length > 0) {
        setBadges(prev => [...prev, ...r.data.newBadges])
        setToast({ msg: `🏅 Badge baru: ${r.data.newBadges.map(b => b.name).join(', ')}!`, type: 'success' })
      } else {
        setToast({ msg: `+${tip.points} EcoPoints berhasil didapat! 🌿`, type: 'success' })
      }
    } catch (e) {
      setToast({ msg: e.response?.data?.error || 'Gagal menyimpan', type: 'error' })
    }
    setLoading(prev => ({ ...prev, [`tip_${tip.id}`]: false }))
  }

  const handleJoinChallenge = async (ch) => {
    if (!ch.active) return
    if (completedChallenges.includes(ch.id)) {
      setToast({ msg: 'Kamu sudah mengikuti tantangan ini!', type: 'info' }); return
    }
    setLoading(prev => ({ ...prev, [`ch_${ch.id}`]: true }))
    try {
      const r = await api.post('/api/tips/challenge', { challengeId: ch.id, points: ch.reward })
      setCompletedChallenges(r.data.completedChallenges || [...completedChallenges, ch.id])
      updateUser({ ecoPoints: r.data.ecoPoints })
      if (r.data.newBadges?.length > 0) {
        setBadges(prev => [...prev, ...r.data.newBadges])
        setToast({ msg: `🏅 Badge baru: ${r.data.newBadges.map(b => b.name).join(', ')}!`, type: 'success' })
      } else {
        setToast({ msg: `+${ch.reward} EcoPoints! Tantangan diterima! 🏆`, type: 'success' })
      }
    } catch (e) {
      setToast({ msg: e.response?.data?.error || 'Gagal', type: 'error' })
    }
    setLoading(prev => ({ ...prev, [`ch_${ch.id}`]: false }))
  }

  const handleCertificate = async () => {
    try {
      const r = await api.get('/api/tips/certificate')
      setCertData(r.data)
      setShowCertModal(true)
    } catch { setToast({ msg: 'Gagal mengambil data sertifikat', type: 'error' }) }
  }

  const downloadCertificate = () => {
    if (!certData) return
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      body{font-family:Georgia,serif;background:#f0faf5;margin:0;padding:40px}
      .cert{background:white;border:8px solid #1D9E75;border-radius:16px;padding:48px;max-width:700px;margin:0 auto;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.15)}
      .logo{font-size:48px;margin-bottom:8px}
      .title{font-size:32px;font-weight:700;color:#085041;margin:0 0 4px}
      .subtitle{font-size:14px;color:#888;margin-bottom:32px}
      .recipient{font-size:20px;color:#555;margin-bottom:4px}
      .name{font-size:40px;font-weight:700;color:#1D9E75;border-bottom:3px solid #1D9E75;display:inline-block;padding-bottom:4px;margin-bottom:32px}
      .stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin:24px 0}
      .stat{background:#f0faf5;border-radius:8px;padding:12px}
      .stat-num{font-size:24px;font-weight:700;color:#085041}
      .stat-label{font-size:11px;color:#888;margin-top:2px}
      .badges-section{margin:24px 0}
      .badge-chip{display:inline-block;background:#E1F5EE;color:#085041;border-radius:99px;padding:4px 12px;font-size:12px;margin:3px}
      .footer{margin-top:32px;font-size:12px;color:#aaa}
      .seal{font-size:48px;margin-bottom:8px}
      .rank{background:linear-gradient(135deg,#1D9E75,#085041);color:white;border-radius:99px;padding:8px 24px;font-size:14px;font-weight:600;display:inline-block;margin-bottom:16px}
    </style></head><body>
    <div class="cert">
      <div class="logo">🌿</div>
      <div class="title">SERTIFIKAT PENGHARGAAN</div>
      <div class="subtitle">EcoScan — Aplikasi Pilah Sampah Cerdas</div>
      <div class="recipient">Diberikan kepada:</div>
      <div class="name">${certData.name}</div>
      <div class="rank">Peringkat #${certData.rank} · ${certData.level}</div>
      <div class="stats">
        <div class="stat"><div class="stat-num">${certData.ecoPoints}</div><div class="stat-label">EcoPoints</div></div>
        <div class="stat"><div class="stat-num">${certData.totalScans}</div><div class="stat-label">Total Scan</div></div>
        <div class="stat"><div class="stat-num">${certData.carbonSaved} kg</div><div class="stat-label">CO₂ Dihemat</div></div>
      </div>
      ${certData.badges.length > 0 ? `<div class="badges-section"><p style="font-size:13px;color:#555;margin-bottom:8px">Badge yang diraih:</p>${certData.badges.map(b => `<span class="badge-chip">${b.emoji} ${b.name}</span>`).join('')}</div>` : ''}
      <p style="font-size:13px;color:#555;margin:16px 0">Atas kontribusi nyata dalam pelestarian lingkungan Indonesia melalui pemilahan sampah yang bijak dan konsisten menggunakan aplikasi EcoScan.</p>
      <div class="seal">🏅</div>
      <div class="footer">Diterbitkan: ${new Date(certData.issuedAt).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})} · ecoscan-tau.vercel.app</div>
    </div></body></html>`

    const blob = new Blob([html], { type: 'text/html' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `Sertifikat_EcoScan_${certData.name.replace(/\s/g,'_')}.html`
    a.click()
  }

  const filtered = filter === 'Semua' ? TIPS : TIPS.filter(t => t.tag === filter)

  return (
    <div className="p-4 space-y-4 pb-6">
      {toast.msg && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: '' })} />}

      <div>
        <h2 className="text-xl font-bold text-gray-800">Tips & Tantangan</h2>
        <p className="text-sm text-gray-400">Dapatkan EcoPoints dari setiap aksi</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {[
          { key: 'tips',        label: '💡 Tips Harian' },
          { key: 'tantangan',   label: '🏆 Tantangan' },
          { key: 'badge',       label: '🏅 Badge' },
          { key: 'leaderboard', label: '🥇 Leaderboard' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab.key ? 'bg-white text-eco-600 shadow-sm' : 'text-gray-500'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TIPS ── */}
      {activeTab === 'tips' && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATS.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === cat ? 'bg-eco-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {filtered.map(tip => {
              const done = completedTips.includes(tip.id)
              return (
                <div key={tip.id} className={`card p-4 transition-all ${done ? 'opacity-75 bg-eco-50' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{tip.emoji}</span>
                      <div>
                        <span className="text-xs px-2 py-0.5 bg-eco-50 text-eco-700 rounded-full font-medium">{tip.tag}</span>
                        <h3 className="font-semibold text-gray-800 text-sm mt-1">{tip.title}</h3>
                      </div>
                    </div>
                    <button onClick={() => setSavedTips(prev => prev.includes(tip.id) ? prev.filter(s => s !== tip.id) : [...prev, tip.id])}
                      className="shrink-0 text-gray-300 hover:text-amber-400 transition-colors">
                      <svg className={`w-5 h-5 ${savedTips.includes(tip.id) ? 'text-amber-400 fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{tip.body}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                      ⭐ +{tip.points} EcoPoints
                    </div>
                    <button onClick={() => handleCompleteTip(tip)}
                      disabled={done || loading[`tip_${tip.id}`]}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${done ? 'bg-eco-100 text-eco-600 cursor-default' : 'bg-eco-500 text-white hover:bg-eco-600 active:scale-95'}`}>
                      {loading[`tip_${tip.id}`] ? '...' : done ? '✓ Sudah Selesai' : 'Tandai Selesai'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── TANTANGAN ── */}
      {activeTab === 'tantangan' && (
        <div className="space-y-3">
          {CHALLENGES.map(ch => {
            const done = completedChallenges.includes(ch.id)
            return (
              <div key={ch.id} className={`card p-4 transition-all ${done ? 'border-eco-200 bg-eco-50' : ch.active ? '' : 'opacity-60'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${done ? 'bg-eco-100' : ch.active ? 'bg-eco-50' : 'bg-gray-50'}`}>
                    {ch.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-gray-800 text-sm">{ch.title}</h3>
                      {done && <span className="text-xs bg-eco-100 text-eco-700 px-2 py-0.5 rounded-full font-medium shrink-0">✓ Diikuti</span>}
                      {!done && ch.active && <span className="text-xs bg-eco-100 text-eco-700 px-2 py-0.5 rounded-full font-medium shrink-0">Aktif</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{ch.desc}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-400">⏱️ {ch.duration}</span>
                      <span className="text-xs text-amber-600 font-medium">⭐ +{ch.reward} poin</span>
                    </div>
                    <button onClick={() => handleJoinChallenge(ch)}
                      disabled={!ch.active || done || loading[`ch_${ch.id}`]}
                      className={`mt-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-all active:scale-95
                        ${done ? 'bg-eco-100 text-eco-600 cursor-default'
                          : ch.active ? 'bg-eco-500 text-white hover:bg-eco-600'
                          : 'bg-gray-100 text-gray-500 cursor-not-allowed'}`}>
                      {loading[`ch_${ch.id}`] ? '...' : done ? '✓ Tantangan Diterima' : ch.active ? 'Ikut Tantangan' : 'Segera Hadir'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          <div className="card p-4 bg-gradient-to-br from-eco-50 to-green-50 border-eco-100">
            <p className="text-sm font-semibold text-eco-800 mb-1">🌍 Dampak kolektif komunitas</p>
            <p className="text-xs text-eco-600">Bersama-sama pengguna EcoScan berkontribusi mengurangi sampah dan emisi CO₂ Indonesia.</p>
            <div className="h-2 bg-eco-100 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-eco-500 rounded-full" style={{ width: '68%' }}></div>
            </div>
            <div className="flex justify-between text-xs text-eco-600 mt-1">
              <span>2.4 ton CO₂ hemat</span><span>Target: 3.5 ton</span>
            </div>
          </div>
        </div>
      )}

      {/* ── BADGE ── */}
      {activeTab === 'badge' && (
        <div className="space-y-4">
          {badges.length > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold text-gray-800 mb-3">🏅 Badge Kamu ({badges.length})</h3>
              <div className="grid grid-cols-3 gap-3">
                {badges.map(b => (
                  <div key={b.id} className="bg-eco-50 border border-eco-100 rounded-xl p-3 text-center">
                    <div className="text-3xl mb-1">{b.emoji}</div>
                    <p className="text-xs font-medium text-eco-700 leading-tight">{b.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{b.earnedAt ? new Date(b.earnedAt).toLocaleDateString('id-ID') : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 mb-3">🎯 Semua Badge</h3>
            <div className="grid grid-cols-3 gap-3">
              {allBadges.map(b => (
                <div key={b.id} className={`rounded-xl p-3 text-center border transition-all ${b.earned ? 'bg-eco-50 border-eco-200' : 'bg-gray-50 border-gray-100 opacity-50'}`}>
                  <div className={`text-3xl mb-1 ${b.earned ? '' : 'grayscale'}`}>{b.emoji}</div>
                  <p className={`text-xs font-medium leading-tight ${b.earned ? 'text-eco-700' : 'text-gray-400'}`}>{b.name}</p>
                  {b.earned && <p className="text-xs text-eco-500 mt-0.5">✓ Diraih</p>}
                </div>
              ))}
              {allBadges.length === 0 && (
                <div className="col-span-3 text-center py-8 text-gray-400">
                  <p className="text-4xl mb-2">🏅</p>
                  <p className="text-sm">Mulai scan sampah untuk meraih badge pertamamu!</p>
                </div>
              )}
            </div>
          </div>

          {/* Tombol sertifikat */}
          <button onClick={handleCertificate}
            className="w-full btn-primary flex items-center justify-center gap-2">
            📜 Unduh Sertifikat Penghargaan
          </button>
        </div>
      )}

      {/* ── LEADERBOARD ── */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          {/* Period filter */}
          <div className="flex gap-2">
            {[['alltime','Sepanjang Waktu'],['monthly','Bulan Ini']].map(([val,label]) => (
              <button key={val} onClick={() => { setLbPeriod(val); loadLeaderboard(val) }}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${lbPeriod === val ? 'bg-eco-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                {label}
              </button>
            ))}
          </div>

          {myRank && (
            <div className="card p-3 bg-eco-50 border-eco-200 flex items-center justify-between">
              <span className="text-sm text-eco-700 font-medium">📍 Peringkatmu</span>
              <span className="text-eco-600 font-bold">#{myRank} · {user?.ecoPoints || 0} pts</span>
            </div>
          )}

          {lbLoading ? (
            <div className="text-center py-8 text-gray-400">Memuat...</div>
          ) : (
            <div className="card overflow-hidden">
              {leaderboard.map((u, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 transition-all
                  ${u.isMe ? 'bg-eco-50' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                    ${i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : u.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${u.isMe ? 'text-eco-700' : 'text-gray-800'}`}>
                      {u.name} {u.isMe && <span className="text-xs">(Kamu)</span>}
                    </p>
                    <p className="text-xs text-gray-400">{u.totalScans} scan · {u.carbonSaved} kg CO₂</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-eco-600">{u.ecoPoints}</p>
                    <p className="text-xs text-gray-400">pts</p>
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">Belum ada data leaderboard</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Modal Sertifikat ── */}
      {showCertModal && certData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowCertModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <p className="text-4xl mb-2">🏅</p>
              <h3 className="text-lg font-bold text-eco-700">Sertifikat Penghargaan</h3>
            </div>

            {!certData.eligible ? (
              <div className="text-center text-sm text-gray-500 py-4">
                <p>Kamu perlu minimal <b className="text-eco-600">100 EcoPoints</b> untuk mendapatkan sertifikat.</p>
                <p className="mt-1">Saat ini: <b>{certData.ecoPoints} pts</b></p>
              </div>
            ) : (
              <>
                <div className="bg-eco-50 rounded-xl p-4 mb-4 text-center">
                  <p className="text-sm text-gray-500">Diberikan kepada:</p>
                  <p className="text-xl font-bold text-eco-700 mt-1">{certData.name}</p>
                  <p className="text-sm text-eco-600 mt-1">🏆 Peringkat #{certData.rank} · {certData.level}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-eco-600">{certData.ecoPoints}</p>
                    <p className="text-xs text-gray-400">EcoPoints</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-eco-600">{certData.totalScans}</p>
                    <p className="text-xs text-gray-400">Scan</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-eco-600">{certData.carbonSaved}kg</p>
                    <p className="text-xs text-gray-400">CO₂ Hemat</p>
                  </div>
                </div>
                <button onClick={downloadCertificate} className="w-full btn-primary mb-2">
                  ⬇️ Unduh Sertifikat (HTML/PDF)
                </button>
              </>
            )}
            <button onClick={() => setShowCertModal(false)} className="w-full btn-secondary text-sm">Tutup</button>
          </div>
        </div>
      )}
    </div>
  )
}
