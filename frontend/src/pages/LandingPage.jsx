import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'

const WASTE_FACTS = [
  { emoji: '🗑️', stat: '68,5 Juta Ton', desc: 'sampah dihasilkan Indonesia per tahun' },
  { emoji: '♻️', stat: '< 10%',          desc: 'tingkat daur ulang sampah nasional' },
  { emoji: '🌊', stat: '#2 Dunia',       desc: 'penghasil sampah plastik ke laut' },
  { emoji: '💸', stat: 'Rp 23 Triliun',  desc: 'kerugian ekonomi akibat sampah tahunan' },
]

const WASTE_TYPES = [
  { type: 'Plastik',    pct: 35, color: '#378ADD', emoji: '🧴' },
  { type: 'Organik',    pct: 57, color: '#1D9E75', emoji: '🌿' },
  { type: 'Kertas',     pct: 8,  color: '#EF9F27', emoji: '📰' },
  { type: 'Logam',      pct: 3,  color: '#888780', emoji: '🥫' },
  { type: 'B3',         pct: 2,  color: '#E24B4A', emoji: '⚠️' },
  { type: 'Elektronik', pct: 1,  color: '#8B5CF6', emoji: '📱' },
]

const FEATURES = [
  { icon: '📷', title: 'Scan AI Instan',      desc: 'Foto sampah → AI klasifikasi otomatis ke 8 kategori dalam hitungan detik' },
  { icon: '💡', title: 'Tips Personalisasi',  desc: 'Dapatkan panduan daur ulang yang tepat berdasarkan jenis sampahmu' },
  { icon: '🏆', title: 'Gamifikasi',          desc: 'Kumpulkan EcoPoints, raih badge, dan bersaing di leaderboard' },
  { icon: '📊', title: 'Pantau Dampakmu',     desc: 'Lihat berapa kg CO₂ yang berhasil kamu hemat dengan pilah sampah' },
  { icon: '📜', title: 'Sertifikat Digital',  desc: 'Pengguna terbaik mendapat sertifikat penghargaan digital resmi' },
  { icon: '🌍', title: 'Dampak Nyata',        desc: 'Bergabung dengan ribuan pengguna yang bersama-sama jaga bumi' },
]

const PROVINCES = ['DKI Jakarta', 'Jawa Barat', 'Jawa Timur', 'Jawa Tengah', 'Bali', 'Sumatera Utara']
const WASTE_PROBLEMS = [
  { province: 'DKI Jakarta',  ton: 7500, color: '#E24B4A' },
  { province: 'Jawa Barat',   ton: 5800, color: '#EF9F27' },
  { province: 'Jawa Timur',   ton: 5200, color: '#378ADD' },
  { province: 'Jawa Tengah',  ton: 4100, color: '#1D9E75' },
  { province: 'Bali',         ton: 1100, color: '#8B5CF6' },
  { province: 'Sumatera Utara', ton: 3900, color: '#EC4899' },
]

export default function LandingPage() {
  const maxTon = Math.max(...WASTE_PROBLEMS.map(p => p.ton))

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-eco-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">🌿</span>
          </div>
          <span className="font-bold text-eco-700 text-lg">EcoScan</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-eco-600 px-3 py-1.5 transition-colors">
            Masuk
          </Link>
          <Link to="/register" className="text-sm font-medium bg-eco-500 text-white px-4 py-1.5 rounded-lg hover:bg-eco-600 transition-colors">
            Daftar Gratis
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-eco-700 via-eco-600 to-eco-500 text-white px-4 pt-16 pb-20">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-white/5 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/3 rounded-full"></div>
        </div>

        <div className="relative max-w-lg mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-white/20">
            🇮🇩 Solusi Sampah Indonesia
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Pilah Sampah<br/>
            <span className="text-eco-100">Lebih Cerdas</span><br/>
            dengan AI
          </h1>
          <p className="text-eco-100 text-base leading-relaxed mb-8 max-w-sm mx-auto">
            Foto sampahmu, biarkan AI mengklasifikasikan, dan dapatkan panduan daur ulang yang tepat. Bersama jaga bumi Indonesia.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register"
              className="bg-white text-eco-700 font-semibold px-6 py-3.5 rounded-xl hover:bg-eco-50 transition-all active:scale-95 shadow-lg">
              🚀 Mulai Gratis Sekarang
            </Link>
            <Link to="/login"
              className="bg-white/10 text-white font-medium px-6 py-3.5 rounded-xl border border-white/30 hover:bg-white/20 transition-all">
              Sudah punya akun
            </Link>
          </div>
        </div>
      </section>

      {/* ── Statistik Indonesia ── */}
      <section className="px-4 py-12 bg-gray-50">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold text-eco-600 tracking-wider uppercase bg-eco-50 px-3 py-1 rounded-full">Fakta Sampah Indonesia</span>
            <h2 className="text-2xl font-bold text-gray-800 mt-3">Krisis Sampah yang<br/>Butuh Solusi Nyata</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {WASTE_FACTS.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="text-3xl mb-2">{f.emoji}</div>
                <div className="text-xl font-bold text-eco-700">{f.stat}</div>
                <div className="text-xs text-gray-500 mt-1 leading-tight">{f.desc}</div>
              </div>
            ))}
          </div>

          {/* Komposisi sampah */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">Komposisi Sampah Nasional</h3>
            <div className="space-y-3">
              {WASTE_TYPES.map((w, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xl w-8 shrink-0">{w.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{w.type}</span>
                      <span className="font-semibold" style={{ color: w.color }}>{w.pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${w.pct}%`, background: w.color }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">Sumber: KLHK 2023</p>
          </div>

          {/* Chart per provinsi */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">Produksi Sampah per Provinsi (ton/hari)</h3>
            <div className="space-y-3">
              {WASTE_PROBLEMS.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-28 shrink-0 truncate">{p.province}</span>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-50 rounded-lg overflow-hidden relative">
                      <div className="h-full rounded-lg flex items-center pl-2 transition-all"
                        style={{ width: `${(p.ton/maxTon)*100}%`, background: p.color }}>
                        <span className="text-white text-xs font-semibold">{p.ton.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">Sumber: BPS 2023</p>
          </div>
        </div>
      </section>

      {/* ── Fitur Aplikasi ── */}
      <section className="px-4 py-12 bg-white">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold text-eco-600 tracking-wider uppercase bg-eco-50 px-3 py-1 rounded-full">Fitur EcoScan</span>
            <h2 className="text-2xl font-bold text-gray-800 mt-3">Semua yang Kamu<br/>Butuhkan untuk Pilah Sampah</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-eco-50 rounded-2xl p-4 border border-eco-100">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-eco-800 text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-eco-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cara Kerja ── */}
      <section className="px-4 py-12 bg-gradient-to-br from-eco-700 to-eco-500 text-white">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Cara Pakai EcoScan</h2>
            <p className="text-eco-100 text-sm mt-2">Hanya 3 langkah mudah</p>
          </div>
          <div className="space-y-4">
            {[
              { num: '01', icon: '📷', title: 'Foto Sampah', desc: 'Ambil foto sampah menggunakan kamera HP atau unggah dari galeri' },
              { num: '02', icon: '🤖', title: 'AI Klasifikasi', desc: 'Model TensorFlow menganalisis gambar dan mengidentifikasi jenis sampah' },
              { num: '03', icon: '♻️', title: 'Tips & Poin',  desc: 'Dapatkan panduan daur ulang dan kumpulkan EcoPoints untuk reward' },
            ].map((s, i) => (
              <div key={i} className="flex gap-4 bg-white/10 rounded-2xl p-4 border border-white/20">
                <div className="text-3xl shrink-0 w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">{s.icon}</div>
                <div>
                  <div className="text-eco-100 text-xs font-mono mb-1">{s.num}</div>
                  <h3 className="font-semibold text-white">{s.title}</h3>
                  <p className="text-eco-100 text-xs mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 py-14 bg-white text-center">
        <div className="max-w-sm mx-auto">
          <p className="text-5xl mb-4">🌿</p>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Mulai Berkontribusi<br/>untuk Bumi</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Bergabunglah dengan ribuan pengguna EcoScan yang sudah berkontribusi mengurangi sampah Indonesia. Gratis selamanya.
          </p>
          <Link to="/register"
            className="block bg-eco-500 text-white font-semibold py-4 rounded-xl hover:bg-eco-600 transition-all active:scale-95 shadow-lg text-base">
            🚀 Daftar Gratis Sekarang
          </Link>
          <Link to="/login" className="block text-sm text-gray-400 hover:text-eco-600 transition-colors mt-4">
            Sudah punya akun? Masuk
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-eco-700 text-white px-4 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-2xl">🌿</span>
          <span className="font-bold text-lg">EcoScan</span>
        </div>
        <p className="text-eco-200 text-xs mb-2">Aplikasi Pilah Sampah Cerdas Berbasis AI</p>
        <p className="text-eco-300 text-xs">© 2026 EcoScan · Coding Camp DBS Foundation · ecoscan-tau.vercel.app</p>
      </footer>
    </div>
  )
}
