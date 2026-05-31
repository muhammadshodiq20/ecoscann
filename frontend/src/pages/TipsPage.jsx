import { useState } from 'react'

const TIPS = [
  {
    id: 1, category: 'plastik', emoji: '♻️', title: 'Daur ulang botol plastik PET',
    body: 'Botol plastik kode PET (1) adalah yang paling mudah didaur ulang. Cuci bersih, lepas tutup dan label, lalu kumpulkan di bank sampah. 1 kg botol plastik dapat dihemat menjadi serat pakaian daur ulang.',
    points: 50, tag: 'Plastik'
  },
  {
    id: 2, category: 'organik', emoji: '🌱', title: 'Kompos rumahan dalam 30 hari',
    body: 'Sisa kulit buah, sayur, dan ampas kopi bisa jadi kompos dalam 30 hari. Siapkan ember berlubang, campurkan bahan organik dengan daun kering 1:1, aduk tiap 3 hari. Gratis pupuk berkualitas!',
    points: 75, tag: 'Organik'
  },
  {
    id: 3, category: 'energi', emoji: '💡', title: 'Matikan perangkat yang tidak dipakai',
    body: 'Mode standby TV dan charger yang masih tancap tetap mengonsumsi listrik (phantom load) hingga 10% dari tagihan bulanan. Cabut charger dan matikan stop kontak saat tidak dipakai.',
    points: 30, tag: 'Energi'
  },
  {
    id: 4, category: 'air', emoji: '💧', title: 'Hemat air saat menyikat gigi',
    body: 'Mematikan keran saat gosok gigi bisa hemat hingga 8 liter per menit. Gunakan gelas untuk berkumur. Kebiasaan kecil ini menghemat ratusan liter air per bulan per keluarga!',
    points: 25, tag: 'Air'
  },
  {
    id: 5, category: 'belanja', emoji: '🛍️', title: 'Bawa tas belanja sendiri',
    body: 'Satu kantong plastik butuh 500 tahun untuk terurai. Biasakan bawa tas kain saat belanja. Pilih tas kanvas atau tas anyaman yang bisa dipakai ratusan kali.',
    points: 40, tag: 'Belanja'
  },
  {
    id: 6, category: 'makanan', emoji: '🍱', title: 'Meal prep mingguan kurangi food waste',
    body: 'Rencanakan menu seminggu ke depan, belanja sesuai kebutuhan, dan masak dalam porsi besar lalu simpan. Cara ini terbukti mengurangi food waste hingga 40% dan hemat pengeluaran.',
    points: 60, tag: 'Makanan'
  },
  {
    id: 7, category: 'transportasi', emoji: '🚲', title: 'Ganti perjalanan pendek dengan jalan kaki',
    body: 'Perjalanan di bawah 2 km dengan motor menghasilkan lebih banyak emisi karena mesin belum optimal. Ganti dengan jalan kaki atau sepeda — lebih sehat dan ramah lingkungan.',
    points: 45, tag: 'Transportasi'
  },
  {
    id: 8, category: 'elektronik', emoji: '📱', title: 'Perbaiki dulu sebelum beli baru',
    body: 'Produksi 1 smartphone menghasilkan ~70 kg CO₂. Sebelum ganti HP, coba perbaiki dulu — baterai bisa diganti, layar bisa diperbaiki. Satu keputusan perbaiki = setara tanam 3 pohon.',
    points: 80, tag: 'Elektronik'
  },
]

const CHALLENGES = [
  { id: 1, title: '7 Hari Tanpa Plastik Sekali Pakai', reward: 200, duration: '7 hari', icon: '🏆', active: true },
  { id: 2, title: 'Scan 10 Sampah Minggu Ini', reward: 100, duration: '7 hari', icon: '🔍', active: true },
  { id: 3, title: 'Kompos Pertamamu', reward: 150, duration: '30 hari', icon: '🌱', active: false },
  { id: 4, title: '30 Hari Zero Food Waste', reward: 300, duration: '30 hari', icon: '🎯', active: false },
]

const CATEGORIES_FILTER = ['Semua', 'Plastik', 'Organik', 'Energi', 'Air', 'Belanja', 'Makanan', 'Transportasi', 'Elektronik']

export default function TipsPage() {
  const [filter, setFilter] = useState('Semua')
  const [savedTips, setSavedTips] = useState([])
  const [activeTab, setActiveTab] = useState('tips')

  const filtered = filter === 'Semua' ? TIPS : TIPS.filter(t => t.tag === filter)

  const toggleSave = (id) => {
    setSavedTips(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Tips & Tantangan</h2>
        <p className="text-sm text-gray-400">Dapatkan EcoPoints dari setiap aksi</p>
      </div>

      {/* Tab */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {['tips', 'tantangan'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-white text-eco-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab === 'tips' ? '💡 Tips Harian' : '🏆 Tantangan'}
          </button>
        ))}
      </div>

      {activeTab === 'tips' ? (
        <>
          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES_FILTER.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === cat ? 'bg-eco-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Tips list */}
          <div className="space-y-3">
            {filtered.map(tip => (
              <div key={tip.id} className="card p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{tip.emoji}</span>
                    <div>
                      <span className="text-xs px-2 py-0.5 bg-eco-50 text-eco-700 rounded-full font-medium">{tip.tag}</span>
                      <h3 className="font-semibold text-gray-800 text-sm mt-1">{tip.title}</h3>
                    </div>
                  </div>
                  <button onClick={() => toggleSave(tip.id)} className="shrink-0 text-gray-300 hover:text-amber-400 transition-colors">
                    <svg className={`w-5 h-5 ${savedTips.includes(tip.id) ? 'text-amber-400 fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{tip.body}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    +{tip.points} EcoPoints bila diterapkan
                  </div>
                  <button className="text-xs text-eco-600 font-medium hover:underline">Tandai selesai</button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {CHALLENGES.map(ch => (
            <div key={ch.id} className={`card p-4 ${ch.active ? 'border-eco-200' : 'opacity-70'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${ch.active ? 'bg-eco-50' : 'bg-gray-50'}`}>
                  {ch.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 text-sm">{ch.title}</h3>
                    {ch.active && <span className="text-xs bg-eco-100 text-eco-700 px-2 py-0.5 rounded-full font-medium">Aktif</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-gray-400">⏱️ {ch.duration}</span>
                    <span className="text-xs text-amber-600 font-medium">⭐ +{ch.reward} poin</span>
                  </div>
                  <button className={`mt-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${ch.active ? 'bg-eco-500 text-white hover:bg-eco-600' : 'bg-gray-100 text-gray-500 cursor-not-allowed'}`}>
                    {ch.active ? 'Ikut Tantangan' : 'Segera Hadir'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="card p-4 bg-gradient-to-br from-eco-50 to-green-50 border-eco-100">
            <p className="text-sm font-semibold text-eco-800 mb-1">🌍 Dampak kolektif komunitas</p>
            <p className="text-xs text-eco-600">1,234 pengguna EcoScan sudah menyelesaikan tantangan bulan ini dan bersama-sama menghemat 2.4 ton CO₂!</p>
            <div className="h-2 bg-eco-100 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-eco-500 rounded-full" style={{ width: '68%' }}></div>
            </div>
            <div className="flex justify-between text-xs text-eco-600 mt-1">
              <span>2.4 ton tercapai</span>
              <span>Target: 3.5 ton</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
