import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const WASTE_COLORS = {
  plastik: 'bg-blue-100 text-blue-700',
  organik: 'bg-green-100 text-green-700',
  kertas: 'bg-amber-100 text-amber-700',
  logam: 'bg-gray-100 text-gray-700',
  kaca: 'bg-cyan-100 text-cyan-700',
  b3: 'bg-red-100 text-red-700',
  elektronik: 'bg-purple-100 text-purple-700',
  tekstil: 'bg-pink-100 text-pink-700'
}

export default function ScanPage() {
  const { user, updateUser } = useAuth()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [pointsToast, setPointsToast] = useState(false)

  // Mode: 'menu' | 'camera-back' | 'camera-front' | 'camera-laptop' | 'result'
  const [mode, setMode] = useState('menu')
  const [cameraReady, setCameraReady] = useState(false)
  const [facingMode, setFacingMode] = useState('environment') // back camera default
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)

  const fileRef = useRef()
  const videoRef = useRef()
  const canvasRef = useRef()
  const streamRef = useRef(null)

  // Cek apakah ada lebih dari 1 kamera
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then(devices => {
      const cameras = devices.filter(d => d.kind === 'videoinput')
      setHasMultipleCameras(cameras.length > 1)
    }).catch(() => {})
  }, [])

  // Stop kamera saat unmount atau ganti mode
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraReady(false)
  }, [])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  // Mulai kamera
  const startCamera = async (facing) => {
    stopCamera()
    setError('')
    try {
      const constraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
          setCameraReady(true)
        }
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Akses kamera ditolak. Izinkan kamera di pengaturan browser.')
      } else if (err.name === 'NotFoundError') {
        setError('Kamera tidak ditemukan di perangkat ini.')
      } else {
        setError('Gagal mengakses kamera: ' + err.message)
      }
      setMode('menu')
    }
  }

  const openCamera = async (type) => {
    const facing = type === 'front' ? 'user' : 'environment'
    setFacingMode(facing)
    setMode('camera')
    await startCamera(facing)
  }

  const flipCamera = async () => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(newFacing)
    await startCamera(newFacing)
  }

  // Ambil foto dari kamera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    // Mirror jika kamera depan
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
      stopCamera()
      setMode('menu')
      handleFile(file)
    }, 'image/jpeg', 0.92)
  }

  // Upload file dari galeri
  const handleFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('File harus berupa gambar.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Ukuran gambar maksimal 10MB.'); return }

    setError('')
    setResult(null)

    const reader = new FileReader()
    reader.onload = e => setPreview(e.target.result)
    reader.readAsDataURL(file)

    setLoading(true)
    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await api.post('/api/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(res.data)
      updateUser({
        ecoPoints: (user?.ecoPoints || 0) + res.data.pointsEarned,
        totalScans: (user?.totalScans || 0) + 1
      })
      setPointsToast(true)
      setTimeout(() => setPointsToast(false), 3000)
    } catch (err) {
      const errMsg = err.response?.data?.error
      const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout')
      if (isTimeout) {
        setError('AI membutuhkan waktu lebih lama. Coba lagi — biasanya lebih cepat setelah pertama kali.')
      } else if (err.response?.status === 401) {
        setError('Sesi habis. Silakan login ulang.')
      } else if (err.response?.status === 500) {
        setError(errMsg || 'Server error. Coba beberapa saat lagi.')
      } else if (!err.response) {
        setError('Tidak bisa terhubung ke server. Cek koneksi internet kamu.')
      } else {
        setError(errMsg || 'Gagal menganalisis gambar. Coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  const resetScan = () => {
    setResult(null)
    setPreview(null)
    setError('')
  }

  // ─── Tampilan Kamera Live ────────────────────────────────────────
  if (mode === 'camera') {
    return (
      <div className="relative h-screen bg-black flex flex-col">
        {/* Video feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`flex-1 w-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scan frame overlay */}
        {cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-64">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
              {/* Scan line */}
              <div className="absolute left-2 right-2 h-0.5 bg-green-400 opacity-80 scan-animation"></div>
            </div>
          </div>
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
          <button onClick={() => { stopCamera(); setMode('menu') }}
            className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <p className="text-white text-sm font-medium drop-shadow">
            {cameraReady ? 'Arahkan ke sampah lalu foto' : 'Membuka kamera...'}
          </p>
          {hasMultipleCameras && (
            <button onClick={flipCamera}
              className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
          )}
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 pb-10 pt-6 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-center gap-8">
          {/* Galeri shortcut */}
          <button onClick={() => { stopCamera(); setMode('menu'); fileRef.current?.click() }}
            className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white border border-white/30">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </button>

          {/* Tombol capture utama */}
          <button
            onClick={capturePhoto}
            disabled={!cameraReady}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 bg-white rounded-full"></div>
          </button>

          {/* Flip placeholder */}
          <div className="w-12 h-12"></div>
        </div>

        {/* Loading indicator saat kamera belum siap */}
        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center text-white">
              <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm">Membuka kamera...</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── Tampilan Utama ──────────────────────────────────────────────
  return (
    <div className="p-4 space-y-4">
      {/* Points Toast */}
      {pointsToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-green-600 text-white px-5 py-2.5 rounded-full shadow-lg text-sm font-medium flex items-center gap-2 z-50 fade-in">
          ⭐ +{result?.pointsEarned || 20} EcoPoints!
        </div>
      )}

      {/* Greeting */}
      <div className="rounded-2xl p-4 bg-gradient-to-r from-green-600 to-green-700 border-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm">Hai, {user?.name?.split(' ')[0]}! 👋</p>
            <h2 className="text-white font-bold text-lg mt-0.5">Scan sampah sekarang</h2>
            <p className="text-green-100 text-xs mt-1">{user?.totalScans || 0} scan · {(user?.carbonSaved || 0).toFixed(1)} kg CO₂ dihemat</p>
          </div>
          <div className="text-4xl">🌿</div>
        </div>
      </div>

      {/* Preview hasil upload */}
      {preview && !result && (
        <div className="relative rounded-2xl overflow-hidden border border-gray-100">
          <img src={preview} alt="Preview" className="w-full max-h-56 object-contain bg-gray-50" />
          {loading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white px-4">
                <div className="relative w-24 h-24 mx-auto mb-2 border-2 border-green-300 rounded-lg overflow-hidden">
                  <div className="absolute left-0 right-0 h-0.5 bg-green-400 scan-animation"></div>
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-300"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-300"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-300"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-300"></div>
                </div>
                <p className="text-sm font-medium">AI sedang menganalisis...</p>
                <p className="text-xs text-green-200 mt-1">Mohon tunggu hingga 30 detik ☕</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pilihan scan — 3 tombol kamera */}
      {!result && (
        <>
          <div className="grid grid-cols-1 gap-3">
            {/* Kamera Belakang HP (default untuk mobile) */}
            <button
              onClick={() => openCamera('back')}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-green-300 hover:bg-green-50 active:scale-95 transition-all"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">📷 Kamera Belakang</p>
                <p className="text-xs text-gray-400 mt-0.5">Terbaik untuk foto sampah (HP & Laptop)</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </button>

            {/* Kamera Depan / Selfie */}
            <button
              onClick={() => openCamera('front')}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-blue-300 hover:bg-blue-50 active:scale-95 transition-all"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">🤳 Kamera Depan / Selfie</p>
                <p className="text-xs text-gray-400 mt-0.5">Kamera depan HP atau webcam laptop</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </button>

            {/* Upload dari Galeri */}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-amber-300 hover:bg-amber-50 active:scale-95 transition-all"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">🖼️ Upload dari Galeri</p>
                <p className="text-xs text-gray-400 mt-0.5">Pilih foto dari galeri HP atau folder laptop</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
          <canvas ref={canvasRef} className="hidden" />

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Tips cara pakai */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-green-700 mb-1">💡 Tips scan terbaik:</p>
            <ul className="text-xs text-green-600 space-y-0.5">
              <li>• Pastikan sampah terlihat jelas dan tidak blur</li>
              <li>• Cahaya cukup, hindari backlight</li>
              <li>• 1 jenis sampah per foto untuk akurasi terbaik</li>
            </ul>
          </div>
        </>
      )}

      {/* Hasil Scan */}
      {result && (
        <div className="space-y-4 fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <img src={preview} alt="Hasil" className="w-full max-h-48 object-contain rounded-xl mb-4 bg-gray-50" />

            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${WASTE_COLORS[result.wasteType] || 'bg-gray-100 text-gray-700'}`}>
                {result.wasteType?.charAt(0).toUpperCase() + result.wasteType?.slice(1)}
              </span>
              <span className="text-xs text-gray-400">Akurasi: {result.confidence > 1 ? result.confidence.toFixed(1) : (result.confidence * 100).toFixed(1)}%</span>
              <span className="ml-auto text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+{result.pointsEarned} poin</span>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-1.5">Jejak karbon</p>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(10, 100 - result.carbonScore * 20)}%` }}></div>
              </div>
              <p className="text-xs text-green-600 mt-1">~{result.carbonScore} kg CO₂ ekuivalen</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">Cara pengelolaan yang benar:</p>
              {result.steps?.map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-700 mb-1.5">
                  <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                  {step}
                </div>
              ))}
            </div>

            {result.tips && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                <p className="text-xs font-medium text-green-700">💡 Tahukah kamu?</p>
                <p className="text-xs text-green-600 mt-1">{result.tips}</p>
              </div>
            )}
          </div>

          <button onClick={resetScan} className="w-full py-3 px-4 rounded-xl bg-green-600 text-white font-medium text-sm hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2">
            🔄 Scan Lagi
          </button>
        </div>
      )}
    </div>
  )
}
