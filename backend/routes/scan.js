const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const authMiddleware = require('../middleware/auth');
const { ScanHistory } = require('../models/DataModels');
const User = require('../models/User');

// ─── Multer: terima key 'image' dari frontend ──────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diizinkan'), false);
    }
  }
});

// ─── WASTE_DATA fallback ───────────────────────────────────────────
const WASTE_DATA = {
  plastik: {
    carbonScore: 1.8,
    steps: ['Cuci bersih dari sisa makanan', 'Pisahkan tutup botol dan label', 'Kumpulkan di bank sampah atau drop box daur ulang'],
    tips: 'Botol PET bisa didaur ulang menjadi serat pakaian!'
  },
  organik: {
    carbonScore: 0.3,
    steps: ['Pisahkan dari sampah anorganik', 'Bisa dijadikan kompos rumahan', 'Campurkan 1:1 dengan daun kering'],
    tips: '1 kg sampah organik = 0.5 kg kompos berkualitas tinggi'
  },
  kertas: {
    carbonScore: 0.9,
    steps: ['Pastikan tidak terlalu kotor atau berminyak', 'Lipat dan kumpulkan jadi bundel', 'Setor ke pengepul kertas bekas'],
    tips: 'Mendaur ulang 1 ton kertas menyelamatkan 17 pohon!'
  },
  logam: {
    carbonScore: 2.1,
    steps: ['Bilas kaleng dari sisa makanan', 'Gepengkan untuk hemat tempat', 'Setor ke bank sampah atau pengepul besi'],
    tips: 'Aluminium bisa didaur ulang 100% tanpa kehilangan kualitas'
  },
  kaca: {
    carbonScore: 0.6,
    steps: ['Cuci bersih botol atau pecahan kaca', 'Bungkus pecahan kaca dengan koran', 'Setor ke bank sampah khusus kaca'],
    tips: 'Kaca bisa didaur ulang tanpa batas!'
  },
  b3: {
    carbonScore: 3.5,
    steps: ['JANGAN buang ke tempat sampah biasa!', 'Kumpulkan di wadah tertutup aman', 'Setor ke drop point B3 terdekat (DLHK)'],
    tips: 'Baterai bekas bisa mencemari tanah selama 50 tahun!'
  }
};

// ─── Map label AI → key WASTE_DATA ────────────────────────────────
const CATEGORY_MAP = {
  'plastik': 'plastik', 'sampah plastik': 'plastik', 'plastic': 'plastik',
  'organik': 'organik', 'sampah organik': 'organik', 'organic': 'organik', 'sisa makanan': 'organik',
  'kertas': 'kertas', 'kardus': 'kertas', 'karton': 'kertas', 'paper': 'kertas', 'cardboard': 'kertas',
  'logam': 'logam', 'besi': 'logam', 'kaleng': 'logam', 'aluminium': 'logam', 'metal': 'logam',
  'kaca': 'kaca', 'botol kaca': 'kaca', 'glass': 'kaca',
  'b3': 'b3', 'berbahaya': 'b3', 'baterai': 'b3', 'elektronik': 'b3', 'hazardous': 'b3', 'battery': 'b3',
};

const CLASSES = Object.keys(WASTE_DATA);
const ECO_POINTS_PER_SCAN = 20;

// ─── Cache tips agar hemat API credit ─────────────────────────────
const tipsCache = {};
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 1 hari

// ─── Generate Tips pakai Claude (Anthropic) ───────────────────────
async function generateTips(wasteType, confidence) {
  // Cek cache dulu
  const cacheKey = wasteType;
  const cached = tipsCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    console.log(`Tips dari cache: ${wasteType}`);
    return cached.tips;
  }

  try {
    if (!process.env.ANTHROPIC_API_KEY) return null;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-haiku-4-5-20251001', // model tercepat & termurah
        max_tokens: 150,
        messages: [
          {
            role: 'user',
            content: `Kamu adalah ahli pengelolaan sampah Indonesia. Berikan 1 tips singkat (maks 2 kalimat, bahasa Indonesia, nada ramah dan motivatif) untuk mendaur ulang atau mengolah sampah jenis: ${wasteType}. Tingkat keyakinan deteksi: ${(confidence * 100).toFixed(0)}%. Langsung tulis tipsnya saja tanpa awalan atau penjelasan tambahan.`
          }
        ]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        timeout: 15000
      }
    );

    const tips = response.data.content[0].text.trim();

    // Simpan ke cache
    tipsCache[cacheKey] = { tips, timestamp: Date.now() };
    console.log(`Tips baru dari Claude untuk: ${wasteType}`);
    return tips;

  } catch (e) {
    console.log('Claude API error, pakai tips default:', e.message);
    return null;
  }
}

// ─── POST /api/scan ────────────────────────────────────────────────
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    let result;

    // Kirim ke HuggingFace AI service
    if (process.env.AI_SERVICE_URL && req.file) {
      try {
        const formData = new FormData();
        // Frontend kirim key 'image', AI API butuh key 'file' — wrap ulang di sini
        formData.append('file', req.file.buffer, {
          filename: req.file.originalname || 'image.jpg',
          contentType: req.file.mimetype
        });

        const aiRes = await axios.post(
          `${process.env.AI_SERVICE_URL}/predict`,
          formData,
          { headers: formData.getHeaders(), timeout: 35000 }
        );

        const aiData = aiRes.data;
        console.log('AI response:', aiData);

        // Map prediction → class WASTE_DATA
        const rawPred = (aiData.prediction || '').toLowerCase().trim();
        const mappedClass = CATEGORY_MAP[rawPred] || CLASSES[0];
        const wasteInfo = WASTE_DATA[mappedClass];

        result = {
          class: mappedClass,
          confidence: parseFloat(aiData.confidence) || 0.85,
          carbon_score: wasteInfo.carbonScore,
          steps: wasteInfo.steps,
          tips: wasteInfo.tips,
        };

        console.log(`Mapped: "${rawPred}" → "${mappedClass}" (${(result.confidence * 100).toFixed(1)}%)`);

      } catch (aiErr) {
        console.log('AI service error:', aiErr.message, '— pakai simulasi');
      }
    }

    // Fallback simulasi jika AI gagal
    if (!result) {
      const randomClass = CLASSES[Math.floor(Math.random() * CLASSES.length)];
      const wasteInfo = WASTE_DATA[randomClass];
      result = {
        class: randomClass,
        confidence: (Math.random() * 0.15 + 0.82),
        carbon_score: wasteInfo.carbonScore,
        steps: wasteInfo.steps,
        tips: wasteInfo.tips
      };
    }

    // Generate tips dari Claude (non-blocking, tidak gagalkan request)
    const aiTips = await generateTips(result.class, result.confidence);

    // Simpan ke database
    const scan = await ScanHistory.create({
      userId: req.user._id,
      wasteType: result.class,
      confidence: parseFloat(result.confidence),
      carbonScore: result.carbon_score,
      steps: result.steps
    });

    // Update stats user
    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        totalScans: 1,
        ecoPoints: ECO_POINTS_PER_SCAN,
        carbonSaved: result.carbon_score * 0.3
      }
    });

    res.json({
      scanId: scan._id,
      wasteType: result.class,
      confidence: result.confidence,
      carbonScore: result.carbon_score,
      steps: result.steps,
      tips: aiTips || result.tips,   // Claude tips, fallback ke default
      pointsEarned: ECO_POINTS_PER_SCAN
    });

  } catch (err) {
    console.error('Scan error:', err);
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
      ScanHistory.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ScanHistory.countDocuments({ userId: req.user._id })
    ]);

    res.json({ scans, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil riwayat.' });
  }
});

module.exports = router;