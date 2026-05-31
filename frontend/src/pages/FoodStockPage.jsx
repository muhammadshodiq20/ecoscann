import { useState, useEffect } from 'react'
import api from '../api/axios'

const CATEGORIES = ['protein', 'sayur', 'buah', 'dairy', 'karbohidrat', 'bumbu', 'minuman', 'lainnya']
const CAT_EMOJI = { protein: '🥩', sayur: '🥦', buah: '🍎', dairy: '🥛', karbohidrat: '🍚', bumbu: '🧄', minuman: '🧃', lainnya: '📦' }

function getDaysLeft(expiryDate) {
  if (!expiryDate) return null
  return Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
}

function ExpiryBadge({ days }) {
  if (days === null) return null
  if (days < 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Kadaluarsa!</span>
  if (days === 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Hari ini!</span>
  if (days <= 3) return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">{days} hari lagi</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-eco-100 text-eco-700 font-medium">{days} hari lagi</span>
}

const DEMO_ITEMS = [
  { _id: '1', name: 'Susu Ultra Milk', category: 'dairy', quantity: '1 liter', expiryDate: new Date().toISOString() },
  { _id: '2', name: 'Ayam Filet', category: 'protein', quantity: '500 gram', expiryDate: new Date(Date.now() + 2*864e5).toISOString() },
  { _id: '3', name: 'Yogurt Cimory', category: 'dairy', quantity: '1 cup', expiryDate: new Date(Date.now() + 3*864e5).toISOString() },
  { _id: '4', name: 'Telur 10 pcs', category: 'protein', quantity: '10 butir', expiryDate: new Date(Date.now() + 10*864e5).toISOString() },
  { _id: '5', name: 'Beras 5 kg', category: 'karbohidrat', quantity: '5 kg', expiryDate: new Date(Date.now() + 60*864e5).toISOString() },
  { _id: '6', name: 'Wortel', category: 'sayur', quantity: '4 buah', expiryDate: new Date(Date.now() + 5*864e5).toISOString() }
]

export default function FoodStockPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'lainnya', quantity: '1', expiryDate: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('semua')

  useEffect(() => {
    api.get('/api/food')
      .then(res => setItems(res.data.items))
      .catch(() => setItems(DEMO_ITEMS))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nama item wajib diisi.'); return }
    setSaving(true); setError('')
    try {
      const res = await api.post('/api/food', form)
      setItems(prev => [...prev, res.data.item])
    } catch {
      const newItem = { _id: Date.now().toString(), ...form }
      setItems(prev => [...prev, newItem])
    } finally {
      setForm({ name: '', category: 'lainnya', quantity: '1', expiryDate: '' })
      setShowAdd(false); setSaving(false)
    }
  }

  const handleConsume = async (id) => {
    try { await api.put(`/api/food/${id}/consume`) } catch {}
    setItems(prev => prev.filter(i => i._id !== id))
  }

  const handleDelete = async (id) => {
    try { await api.delete(`/api/food/${id}`) } catch {}
    setItems(prev => prev.filter(i => i._id !== id))
  }

  const expiringSoon = items.filter(i => { const d = getDaysLeft(i.expiryDate); return d !== null && d <= 3 })
  const filtered = filter === 'semua' ? items
    : filter === 'mau-habis' ? expiringSoon
    : items.filter(i => i.category === filter)

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Stok Makanan</h2>
          <p className="text-sm text-gray-400">{items.length} item tersimpan</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Tambah
        </button>
      </div>

      {expiringSoon.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">{expiringSoon.length} item hampir kadaluarsa!</p>
            <p className="text-xs text-amber-600 mt-0.5">{expiringSoon.map(i => i.name).join(', ')}</p>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="card p-4 fade-in">
          <h3 className="font-semibold text-gray-700 mb-3">Tambah Item Baru</h3>
          {error && <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg mb-3">{error}</div>}
          <form onSubmit={handleAdd} className="space-y-3">
            <input type="text" className="input-field" placeholder="Nama makanan / minuman" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
              <input type="text" className="input-field" placeholder="Jumlah (cth: 500 gram)" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tanggal kadaluarsa (opsional)</label>
              <input type="date" className="input-field" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm py-2">{saving ? 'Menyimpan...' : 'Simpan Item'}</button>
              <button type="button" onClick={() => { setShowAdd(false); setError('') }} className="btn-secondary px-4 text-sm py-2">Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['semua', 'mau-habis', 'protein', 'sayur', 'dairy', 'karbohidrat'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === f ? 'bg-eco-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            {f === 'semua' ? 'Semua' : f === 'mau-habis' ? '⚠️ Mau Habis' : `${CAT_EMOJI[f]} ${f.charAt(0).toUpperCase() + f.slice(1)}`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card p-4 animate-pulse"><div className="h-12 bg-gray-50 rounded-lg"></div></div>)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center"><p className="text-3xl mb-2">📦</p><p className="text-gray-500 text-sm">Belum ada item. Tap + Tambah untuk mulai!</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const daysLeft = getDaysLeft(item.expiryDate)
            const isUrgent = daysLeft !== null && daysLeft <= 3
            return (
              <div key={item._id} className={`card p-3 flex items-center gap-3 ${isUrgent ? 'border-amber-200 bg-amber-50/30' : ''}`}>
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl shrink-0">{CAT_EMOJI[item.category] || '📦'}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{item.quantity}</span>
                    {item.expiryDate && <ExpiryBadge days={daysLeft} />}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleConsume(item._id)} title="Sudah dikonsumsi" className="w-8 h-8 rounded-lg bg-eco-50 hover:bg-eco-100 flex items-center justify-center text-eco-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  </button>
                  <button onClick={() => handleDelete(item._id)} title="Hapus" className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total', val: items.length, color: 'text-gray-700' },
            { label: 'Mau habis', val: expiringSoon.length, color: 'text-amber-600' },
            { label: 'Aman', val: items.length - expiringSoon.length, color: 'text-eco-600' }
          ].map((s, i) => (
            <div key={i} className="card p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
