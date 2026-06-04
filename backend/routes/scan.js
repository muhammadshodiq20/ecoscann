const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const authMiddleware = require('../middleware/auth');
const { ScanHistory } = require('../models/DataModels');
const User = require('../models/User');

// ─── Multer ────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Hanya file gambar yang diizinkan'), false);
  }
});

// ─── Data sampah ───────────────────────────────────────────────────
const WASTE_DATA = {
  plastik:    { carbonScore: 1.8, steps: ['Cuci bersih dari sisa makanan', 'Pisahkan tutup botol dan label', 'Kumpulkan di bank sampah atau drop box daur ulang'], tips: '♻️ Botol PET bisa didaur ulang menjadi serat pakaian! 1 kg plastik = hemat 1.5 kg CO₂' },
  organik:    { carbonScore: 0.3, steps: ['Pisahkan dari sampah anorganik', 'Bisa dijadikan kompos rumahan', 'Campurkan 1:1 dengan daun kering, aduk tiap 3 hari'], tips: '🌱 1 kg sampah organik menghasilkan ~0.5 kg kompos berkualitas tinggi' },
  kertas:     { carbonScore: 0.9, steps: ['Pastikan tidak terlalu kotor atau berminyak', 'Lipat dan kumpulkan jadi bundel', 'Setor ke pengepul kertas bekas'], tips: '🌳 Mendaur ulang 1 ton kertas menyelamatkan 17 pohon!' },
  logam:      { carbonScore: 2.1, steps: ['Bilas kaleng dari sisa makanan', 'Gepengkan untuk hemat tempat', 'Setor ke bank sampah atau pengepul besi'], tips: '⚡ Aluminium bisa didaur ulang 100% tanpa kehilangan kualitas' },
  kaca:       { carbonScore: 0.6, steps: ['Cuci bersih botol atau pecahan kaca', 'Bungkus pecahan kaca dengan koran', 'Setor ke bank sampah khusus kaca'], tips: '✨ Kaca bisa didaur ulang tanpa batas!' },
  b3:         { carbonScore: 3.5, steps: ['JANGAN buang ke tempat sampah biasa!', 'Kumpulkan di wadah tertutup aman', 'Setor ke drop point B3 terdekat (DLHK)'], tips: '⚠️ Baterai bekas bisa mencemari 400.000 liter air tanah!' },
  elektronik: { carbonScore: 4.0, steps: ['Jangan dibuang sembarangan', 'Cari e-waste drop point terdekat', 'Hubungi produsen untuk program take-back'], tips: '📱 Produksi 1 HP baru = ~70 kg CO₂. Perbaiki dulu sebelum beli baru!' },
  tekstil:    { carbonScore: 1.2, steps: ['Cuci dan keringkan terlebih dahulu', 'Donasikan jika masih layak pakai', 'Setor ke bank pakaian atau pengepul kain'], tips: '👕 Industri tekstil = 10% emisi CO₂ global. Pakai lebih lama!' }
};

// ─── BUG FIX 1: CATEGORY_MAP diperluas ─────────────────────────────
// HuggingFace mungkin return label dalam berbagai format
// Tambahkan semua kemungkinan label yang bisa keluar dari model
const CATEGORY_MAP = {
  // plastik
  'plastik': 'plastik', 'plastic': 'plastik', 'sampah plastik': 'plastik',
  'botol plastik': 'plastik', 'kantong plastik': 'plastik', 'botol': 'plastik',
  'bottle': 'plastik', 'plastic bottle': 'plastik', 'plastic bag': 'plastik',
  'pластик': 'plastik', '0': 'plastik',

  // organik
  'organik': 'organik', 'organic': 'organik', 'sampah organik': 'organik',
  'sisa makanan': 'organik', 'food waste': 'organik', 'food': 'organik',
  'daun': 'organik', 'biological': 'organik', '1': 'organik',

  // kertas
  'kertas': 'kertas', 'paper': 'kertas', 'kardus': 'kertas',
  'karton': 'kertas', 'cardboard': 'kertas', 'koran': 'kertas',
  'newspaper': 'kertas', 'book': 'kertas', 'buku': 'kertas',
  'tissue': 'kertas', 'tisu': 'kertas', '2': 'kertas',

  // logam
  'logam': 'logam', 'metal': 'logam', 'besi': 'logam',
  'kaleng': 'logam', 'aluminium': 'logam', 'baja': 'logam',
  'can': 'logam', 'steel': 'logam', 'iron': 'logam',
  'tin': 'logam', 'aluminum': 'logam', '3': 'logam',

  // kaca
  'kaca': 'kaca', 'glass': 'kaca', 'botol kaca': 'kaca',
  'kaca pecah': 'kaca', 'broken glass': 'kaca', 'bottle glass': 'kaca',
  'jar': 'kaca', 'toples': 'kaca', '4': 'kaca',

  // b3
  'b3': 'b3', 'baterai': 'b3', 'battery': 'b3',
  'berbahaya': 'b3', 'hazardous': 'b3', 'kimia': 'b3',
  'chemical': 'b3', 'toxic': 'b3', 'cat': 'b3',
  'oli': 'b3', 'obat': 'b3', '5': 'b3',

  // elektronik
  'elektronik': 'elektronik', 'electronic': 'elektronik', 'e-waste': 'elektronik',
  'hp': 'elektronik', 'handphone': 'elektronik', 'komputer': 'elektronik',
  'computer': 'elektronik', 'laptop': 'elektronik', 'kabel': 'elektronik',
  'charger': 'elektronik', 'cable': 'elektronik', 'phone': 'elektronik',
  'gadget': 'elektronik', '6': 'elektronik',

  // tekstil
  'tekstil': 'tekstil', 'textile': 'tekstil', 'kain': 'tekstil',
  'baju': 'tekstil', 'pakaian': 'tekstil', 'fabric': 'tekstil',
  'cloth': 'tekstil', 'clothes': 'tekstil', 'clothing': 'tekstil',
  'kaos': 'tekstil', 'kemeja': 'tekstil', '7': 'tekstil'
};

const CLASSES = Object.keys(WASTE_DATA);
const ECO_POINTS_PER_SCAN = 20;

// ─── Tips cache ─────────────────────────────────────────────────────
const tipsCache = {};

async function generateTips(wasteType) {
  const cached = tipsCache[wasteType];
  if (cached && Date.now() - cached.timestamp < 86400000) return cached.tips;

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey.includes('xxx') || apiKey.includes('GANTI') || apiKey.length < 20) return null;

    const res = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{ role: 'user', content: `Ahli sampah Indonesia. Tips singkat 2 kalimat bahasa Indonesia untuk membuang sampah jenis: ${wasteType}. Langsung tulis tipsnya saja tanpa pembuka.` }]
      },
      { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, timeout: 10000 }
    );

    const tips = res.data.content[0].text.trim();
    tipsCache[wasteType] = { tips, timestamp: Date.now() };
    return tips;
  } catch (e) {
    console.log('[TIPS] Skip:', e.message);
    return null;
  }
}

// ─── BUG FIX 2: callAI — handle semua format response HuggingFace ──
// HuggingFace return: { status, prediction, confidence, message }
// Tapi kode lama hanya baca data.prediction tanpa fallback ke data.class
async function callAI(fileBuffer, filename, mimetype) {
  // Default ke endpoint HuggingFace resmi, fallback dari env var
  const AI_URL = ((process.env.AI_SERVICE_URL || 'https://byuuuu-ecoscan-api.hf.space')).trim().replace(/\/$/, '');

  const formData = new FormData();
  // BUG FIX: Key field harus 'file' sesuai dokumentasi HuggingFace
  formData.append('file', fileBuffer, {
    filename: filename || 'image.jpg',
    contentType: mimetype || 'image/jpeg'
  });

  console.log(`[AI] POST ${AI_URL}/predict`);

  const res = await axios.post(`${AI_URL}/predict`, formData, {
    headers: { ...formData.getHeaders() },
    timeout: 60000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  const data = res.data;
  console.log('[AI] Raw response:', JSON.stringify(data));

  // BUG FIX 3: Handle berbagai format response
  // Format HuggingFace: { status, prediction, confidence, message }
  // Format lokal:       { class, confidence, carbon_score, steps, tips }
  const predLabel =
    data.prediction ||   // Format HuggingFace
    data.class ||        // Format lokal
    data.label ||        // Format alternatif
    data.result ||       // Format alternatif
    null;

  if (!predLabel) {
    throw new Error(`AI response tidak punya field prediksi: ${JSON.stringify(data)}`);
  }

  // Confidence bisa dalam format 0-1 atau 0-100
  let confidence = parseFloat(data.confidence) || 0.85;
  if (confidence > 1) confidence = confidence / 100;

  return {
    rawPrediction: String(predLabel).toLowerCase().trim(),
    confidence,
    originalData: data
  };
}

// ─── POST /api/scan ────────────────────────────────────────────────
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Tidak ada gambar yang dikirim.' });

    let result = null;
    let source = 'simulation';

    // Coba AI HuggingFace
    try {
      const aiData = await callAI(req.file.buffer, req.file.originalname, req.file.mimetype);

      const rawPred = aiData.rawPrediction;
      console.log(`[AI] Label mentah dari HuggingFace: "${rawPred}"`);

      // Coba exact match dulu
      let mappedClass = CATEGORY_MAP[rawPred] || null;

      // Kalau tidak ada exact match, coba partial match
      if (!mappedClass) {
        for (const [key, val] of Object.entries(CATEGORY_MAP)) {
          if (rawPred.includes(key) || key.includes(rawPred)) {
            mappedClass = val;
            console.log(`[AI] Partial match: "${rawPred}" → "${key}" → "${val}"`);
            break;
          }
        }
      }

      // Kalau masih tidak ketemu, coba cari dari CLASSES langsung
      if (!mappedClass) {
        const directMatch = CLASSES.find(c => rawPred.includes(c) || c.includes(rawPred));
        if (directMatch) mappedClass = directMatch;
      }

      if (mappedClass) {
        result = {
          class: mappedClass,
          confidence: aiData.confidence,
          ...WASTE_DATA[mappedClass]
        };
        source = 'ai';
        console.log(`[AI] ✅ "${rawPred}" → "${mappedClass}" (${(aiData.confidence * 100).toFixed(1)}%)`);
      } else {
        console.warn(`[AI] ⚠️ Tidak bisa map label: "${rawPred}"`);
        console.warn(`[AI] Response lengkap:`, JSON.stringify(aiData.originalData));
      }
    } catch (aiErr) {
      const status = aiErr.response?.status || 'no-http';
      const detail = aiErr.response?.data ? JSON.stringify(aiErr.response.data) : aiErr.message;
      console.error(`[AI] ❌ Gagal (${status}): ${detail}`);
    }

    // Fallback simulasi kalau AI gagal
    if (!result) {
      console.log('[SCAN] Pakai simulasi karena AI gagal atau label tidak dikenali');
      // Simulasi deterministik berdasarkan konten gambar (bukan random murni)
      const hashVal = req.file.buffer.slice(0, 200).reduce((a, b) => a + b, 0) % CLASSES.length;
      const cls = CLASSES[hashVal];
      result = {
        class: cls,
        confidence: parseFloat((Math.random() * 0.10 + 0.85).toFixed(4)),
        ...WASTE_DATA[cls]
      };
    }

    // Generate tips AI (non-blocking)
    const aiTips = await generateTips(result.class);

    // Simpan ke database
    const scan = await ScanHistory.create({
      userId: req.user._id,
      wasteType: result.class,
      confidence: result.confidence,
      carbonScore: result.carbonScore,
      steps: result.steps
    });

    // Update statistik user
    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        totalScans: 1,
        ecoPoints: ECO_POINTS_PER_SCAN,
        carbonSaved: result.carbonScore * 0.3
      }
    });

    console.log(`[SCAN] ✅ Selesai — source: ${source}, class: ${result.class}`);

    res.json({
      scanId: scan._id,
      wasteType: result.class,
      confidence: result.confidence,
      carbonScore: result.carbonScore,
      steps: result.steps,
      tips: aiTips || result.tips,
      pointsEarned: ECO_POINTS_PER_SCAN,
      source
    });

  } catch (err) {
    console.error('[SCAN] Fatal error:', err.message);
    res.status(500).json({ error: 'Gagal memproses gambar. Coba lagi.' });
  }
});

// ─── GET /api/scan/history ─────────────────────────────────────────
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [scans, total] = await Promise.all([
      ScanHistory.find({ userId: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ScanHistory.countDocuments({ userId: req.user._id })
    ]);

    res.json({ scans, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil riwayat.' });
  }
});

// ─── GET /api/scan/test-ai ─────────────────────────────────────────
// Endpoint debug: cek koneksi ke HuggingFace
router.get('/test-ai', async (req, res) => {
  const AI_URL = ((process.env.AI_SERVICE_URL || 'https://byuuuu-ecoscan-api.hf.space')).trim().replace(/\/$/, '');

  try {
    const ping = await axios.get(AI_URL, { timeout: 15000 });
    const data = ping.data;
    res.json({
      ok: true,
      ai_url: AI_URL,
      http_status: ping.status,
      model_loaded: data?.model_loaded,
      classes: data?.classes,
      message: '✅ HuggingFace berhasil dijangkau'
    });
  } catch (e) {
    res.json({
      ok: false,
      ai_url: AI_URL,
      error: e.message,
      http_status: e.response?.status,
      message: '❌ HuggingFace tidak bisa dijangkau'
    });
  }
});

module.exports = router;
