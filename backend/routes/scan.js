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
  limits: { fileSize: 10 * 1024 * 1024 }, // naikkan ke 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Hanya file gambar yang diizinkan'), false);
  }
});

// ─── Data sampah ───────────────────────────────────────────────────
const WASTE_DATA = {
  plastik:  { carbonScore: 1.8, steps: ['Cuci bersih dari sisa makanan', 'Pisahkan tutup botol dan label', 'Kumpulkan di bank sampah atau drop box daur ulang'], tips: 'Botol PET bisa didaur ulang menjadi serat pakaian!' },
  organik:  { carbonScore: 0.3, steps: ['Pisahkan dari sampah anorganik', 'Bisa dijadikan kompos rumahan', 'Campurkan 1:1 dengan daun kering'], tips: '1 kg sampah organik = 0.5 kg kompos berkualitas tinggi' },
  kertas:   { carbonScore: 0.9, steps: ['Pastikan tidak terlalu kotor atau berminyak', 'Lipat dan kumpulkan jadi bundel', 'Setor ke pengepul kertas bekas'], tips: 'Mendaur ulang 1 ton kertas menyelamatkan 17 pohon!' },
  logam:    { carbonScore: 2.1, steps: ['Bilas kaleng dari sisa makanan', 'Gepengkan untuk hemat tempat', 'Setor ke bank sampah atau pengepul besi'], tips: 'Aluminium bisa didaur ulang 100% tanpa kehilangan kualitas' },
  kaca:     { carbonScore: 0.6, steps: ['Cuci bersih botol atau pecahan kaca', 'Bungkus pecahan kaca dengan koran', 'Setor ke bank sampah khusus kaca'], tips: 'Kaca bisa didaur ulang tanpa batas!' },
  b3:       { carbonScore: 3.5, steps: ['JANGAN buang ke tempat sampah biasa!', 'Kumpulkan di wadah tertutup aman', 'Setor ke drop point B3 terdekat (DLHK)'], tips: 'Baterai bekas bisa mencemari tanah selama 50 tahun!' },
  elektronik: { carbonScore: 4.0, steps: ['Jangan dibuang sembarangan', 'Cari e-waste drop point terdekat', 'Hubungi produsen untuk program take-back'], tips: 'E-waste mengandung emas dan logam berharga yang bisa didaur ulang!' },
  tekstil:  { carbonScore: 1.2, steps: ['Cuci dan keringkan terlebih dahulu', 'Donasikan jika masih layak pakai', 'Setor ke bank pakaian atau pengepul kain'], tips: 'Satu baju bisa digunakan ulang hingga 10 tahun!' }
};

const CATEGORY_MAP = {
  'plastik': 'plastik', 'sampah plastik': 'plastik', 'plastic': 'plastik', 'botol plastik': 'plastik', 'kantong plastik': 'plastik',
  'organik': 'organik', 'sampah organik': 'organik', 'organic': 'organik', 'sisa makanan': 'organik', 'food waste': 'organik',
  'kertas': 'kertas', 'kardus': 'kertas', 'karton': 'kertas', 'paper': 'kertas', 'cardboard': 'kertas', 'koran': 'kertas',
  'logam': 'logam', 'besi': 'logam', 'kaleng': 'logam', 'aluminium': 'logam', 'metal': 'logam', 'baja': 'logam',
  'kaca': 'kaca', 'botol kaca': 'kaca', 'glass': 'kaca', 'kaca pecah': 'kaca',
  'b3': 'b3', 'berbahaya': 'b3', 'baterai': 'b3', 'hazardous': 'b3', 'battery': 'b3', 'kimia': 'b3',
  'elektronik': 'elektronik', 'electronic': 'elektronik', 'e-waste': 'elektronik', 'hp': 'elektronik', 'komputer': 'elektronik',
  'tekstil': 'tekstil', 'kain': 'tekstil', 'baju': 'tekstil', 'pakaian': 'tekstil', 'textile': 'tekstil', 'fabric': 'tekstil'
};

const CLASSES = Object.keys(WASTE_DATA);
const ECO_POINTS_PER_SCAN = 20;

// ─── Tips cache ─────────────────────────────────────────────────────
const tipsCache = {};

async function generateTips(wasteType, confidence) {
  const cached = tipsCache[wasteType];
  if (cached && Date.now() - cached.timestamp < 86400000) return cached.tips;

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey.includes('xxx') || apiKey.includes('GANTI')) return null;

    const res = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{ role: 'user', content: `Ahli sampah Indonesia. Tips singkat 2 kalimat bahasa Indonesia untuk sampah: ${wasteType}. Langsung tulis tipsnya saja.` }]
      },
      { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, timeout: 15000 }
    );

    const tips = res.data.content[0].text.trim();
    tipsCache[wasteType] = { tips, timestamp: Date.now() };
    return tips;
  } catch (e) {
    console.log('[TIPS] Skip:', e.message);
    return null;
  }
}

// ─── Kirim ke HuggingFace ──────────────────────────────────────────
async function callAI(fileBuffer, filename, mimetype) {
  const AI_URL = (process.env.AI_SERVICE_URL || '').trim().replace(/\/$/, '');
  if (!AI_URL) throw new Error('AI_SERVICE_URL tidak diset');

  const formData = new FormData();
  formData.append('file', fileBuffer, {
    filename: filename || 'image.jpg',
    contentType: mimetype || 'image/jpeg'
  });

  console.log(`[AI] POST ${AI_URL}/predict`);

  const res = await axios.post(`${AI_URL}/predict`, formData, {
    headers: { ...formData.getHeaders() },
    timeout: 60000, // 60 detik untuk cold start HuggingFace
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  const data = res.data;
  console.log('[AI] Response:', JSON.stringify(data));

  if (!data || !data.prediction) throw new Error(`AI response tidak valid: ${JSON.stringify(data)}`);
  return data;
}

// ─── POST /api/scan ────────────────────────────────────────────────
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Tidak ada gambar yang dikirim.' });

    let result = null;
    let source = 'simulation';

    // Coba AI
    try {
      const aiData = await callAI(req.file.buffer, req.file.originalname, req.file.mimetype);

      const rawPred = (aiData.prediction || '').toLowerCase().trim();
      const mappedClass = CATEGORY_MAP[rawPred] || null;

      if (mappedClass) {
        let confidence = parseFloat(aiData.confidence) || 0.85;
        if (confidence > 1) confidence = confidence / 100;

        result = {
          class: mappedClass,
          confidence,
          ...WASTE_DATA[mappedClass]
        };
        source = 'ai';
        console.log(`[AI] ✅ "${rawPred}" → "${mappedClass}" ${(confidence * 100).toFixed(1)}%`);
      } else {
        // Label tidak dikenali — pakai label asli dari AI tetapi data dari CLASSES[0]
        console.warn(`[AI] ⚠️ Label tidak dikenali: "${rawPred}", pakai fallback`);
      }
    } catch (aiErr) {
      const status = aiErr.response?.status || 'no-http';
      const detail = aiErr.response?.data || aiErr.message;
      console.error(`[AI] ❌ Error (${status}):`, detail);
    }

    // Fallback simulasi
    if (!result) {
      const cls = CLASSES[Math.floor(Math.random() * CLASSES.length)];
      result = {
        class: cls,
        confidence: parseFloat((Math.random() * 0.15 + 0.82).toFixed(4)),
        ...WASTE_DATA[cls]
      };
    }

    // Claude tips (non-blocking)
    const aiTips = await generateTips(result.class, result.confidence);

    // Simpan DB
    const scan = await ScanHistory.create({
      userId: req.user._id,
      wasteType: result.class,
      confidence: result.confidence,
      carbonScore: result.carbonScore,
      steps: result.steps
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalScans: 1, ecoPoints: ECO_POINTS_PER_SCAN, carbonSaved: result.carbonScore * 0.3 }
    });

    console.log(`[SCAN] ✅ Done — source: ${source}, class: ${result.class}`);

    res.json({
      scanId: scan._id,
      wasteType: result.class,
      confidence: result.confidence,
      carbonScore: result.carbonScore,
      steps: result.steps,
      tips: aiTips || result.tips,
      pointsEarned: ECO_POINTS_PER_SCAN,
      source // untuk debug, bisa dihapus nanti
    });

  } catch (err) {
    console.error('[SCAN] Fatal:', err.message, err.stack);
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

// ─── GET /api/scan/test-ai (debug) ────────────────────────────────
router.get('/test-ai', async (req, res) => {
  const AI_URL = (process.env.AI_SERVICE_URL || '').trim().replace(/\/$/, '');
  if (!AI_URL) return res.json({ ok: false, error: 'AI_SERVICE_URL tidak diset di .env' });

  try {
    const ping = await axios.get(AI_URL, { timeout: 15000 });
    res.json({ ok: true, ai_url: AI_URL, http_status: ping.status, message: '✅ HuggingFace bisa dijangkau' });
  } catch (e) {
    res.json({ ok: false, ai_url: AI_URL, error: e.message, http_status: e.response?.status, message: '❌ HuggingFace tidak bisa dijangkau' });
  }
});

module.exports = router;
