const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Data tips dan challenges (bisa dipindah ke DB nanti)
const BADGE_RULES = [
  { id: 'first_scan',   name: 'Pemindai Pertama',  emoji: '🔍', condition: u => u.totalScans >= 1 },
  { id: 'scan_10',      name: 'Aktif Pilah',        emoji: '♻️', condition: u => u.totalScans >= 10 },
  { id: 'scan_50',      name: 'Eco Warrior',        emoji: '🥈', condition: u => u.totalScans >= 50 },
  { id: 'scan_100',     name: 'Eco Champion',       emoji: '🏆', condition: u => u.totalScans >= 100 },
  { id: 'points_100',   name: 'Kolektor Hijau',     emoji: '🌱', condition: u => u.ecoPoints >= 100 },
  { id: 'points_500',   name: 'Pejuang Bumi',       emoji: '🌍', condition: u => u.ecoPoints >= 500 },
  { id: 'carbon_5',     name: 'Penjaga CO₂',        emoji: '💚', condition: u => u.carbonSaved >= 5 },
  { id: 'tips_3',       name: 'Pelajar Hijau',      emoji: '📚', condition: u => (u.completedTips || []).length >= 3 },
  { id: 'challenge_1',  name: 'Penerima Tantangan', emoji: '🎯', condition: u => (u.completedChallenges || []).length >= 1 },
];

async function checkAndAwardBadges(user) {
  const currentBadgeIds = (user.badges || []).map(b => b.id);
  const newBadges = [];
  for (const rule of BADGE_RULES) {
    if (!currentBadgeIds.includes(rule.id) && rule.condition(user)) {
      newBadges.push({ id: rule.id, name: rule.name, emoji: rule.emoji, earnedAt: new Date() });
    }
  }
  if (newBadges.length > 0) {
    user.badges = [...(user.badges || []), ...newBadges];
    await user.save();
  }
  return newBadges;
}

// POST /api/tips/complete — tandai tip selesai
router.post('/complete', auth, async (req, res) => {
  try {
    const { tipId, points } = req.body;
    if (!tipId) return res.status(400).json({ error: 'tipId wajib diisi' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    // Cek sudah pernah selesai belum
    if ((user.completedTips || []).includes(Number(tipId))) {
      return res.json({ message: 'Tip sudah pernah diselesaikan', alreadyDone: true, ecoPoints: user.ecoPoints });
    }

    user.completedTips = [...(user.completedTips || []), Number(tipId)];
    user.ecoPoints = (user.ecoPoints || 0) + (Number(points) || 50);
    await user.save();

    const newBadges = await checkAndAwardBadges(user);

    res.json({
      message: 'Tip berhasil diselesaikan! 🎉',
      pointsEarned: Number(points) || 50,
      ecoPoints: user.ecoPoints,
      completedTips: user.completedTips,
      newBadges
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menyimpan tip.' });
  }
});

// POST /api/tips/challenge — ikut tantangan
router.post('/challenge', auth, async (req, res) => {
  try {
    const { challengeId, points } = req.body;
    if (!challengeId) return res.status(400).json({ error: 'challengeId wajib diisi' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    if ((user.completedChallenges || []).includes(Number(challengeId))) {
      return res.json({ message: 'Tantangan sudah diikuti', alreadyDone: true, ecoPoints: user.ecoPoints });
    }

    user.completedChallenges = [...(user.completedChallenges || []), Number(challengeId)];
    user.ecoPoints = (user.ecoPoints || 0) + (Number(points) || 100);
    await user.save();

    const newBadges = await checkAndAwardBadges(user);

    res.json({
      message: 'Berhasil ikut tantangan! 🏆',
      pointsEarned: Number(points) || 100,
      ecoPoints: user.ecoPoints,
      completedChallenges: user.completedChallenges,
      newBadges
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menyimpan tantangan.' });
  }
});

// GET /api/tips/badges — ambil badges user
router.get('/badges', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const currentBadgeIds = (user.badges || []).map(b => b.id);
    const allBadges = BADGE_RULES.map(rule => ({
      ...rule,
      earned: currentBadgeIds.includes(rule.id),
      earnedAt: (user.badges || []).find(b => b.id === rule.id)?.earnedAt || null,
      condition: undefined
    }));
    res.json({ badges: user.badges || [], allBadges });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil badges.' });
  }
});

// Daftar kata tidak pantas yang disensor di leaderboard
const BLOCKED_WORDS = [
  'kontol','memek','ngentot','jancok','bajingan','asu','bangsat','pepek',
  'toket','bokong','kimak','brengsek','anjing','babi','tai','sialan',
  'fuck','shit','bitch','ass','dick','pussy','cock','cunt','nigger',
  'titit','jembut','coli','colmek','ngocok','ngewe','ngeseks','homo',
  'idiot','goblok','tolol','bodoh'
]

function containsBlockedWord(name) {
  const lower = (name || '').toLowerCase().replace(/\s+/g, '')
  return BLOCKED_WORDS.some(w => lower.includes(w))
}

// GET /api/tips/leaderboard — top 20 user berdasarkan ecoPoints
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const period = req.query.period || 'alltime'; // alltime | monthly
    let matchQuery = {};

    if (period === 'monthly') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
      matchQuery = { updatedAt: { $gte: startOfMonth } };
    }

    const leaders = await User.find(matchQuery)
      .sort({ ecoPoints: -1 })
      .limit(50)  // ambil lebih banyak dulu sebelum difilter
      .select('name ecoPoints totalScans carbonSaved badges createdAt');

    const myRank = await User.countDocuments({ ecoPoints: { $gt: req.user.ecoPoints } }) + 1;

    // Filter nama tidak pantas, lalu ambil 20 teratas
    const filtered = leaders.filter(u => !containsBlockedWord(u.name)).slice(0, 20)

    res.json({
      leaderboard: filtered.map((u, i) => ({
        rank: i + 1,
        name: u.name,
        ecoPoints: u.ecoPoints,
        totalScans: u.totalScans,
        carbonSaved: parseFloat((u.carbonSaved || 0).toFixed(1)),
        topBadge: u.badges?.slice(-1)[0] || null,
        isMe: u._id.toString() === req.user._id.toString()
      })),
      myRank,
      myPoints: req.user.ecoPoints
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil leaderboard.' });
  }
});

// GET /api/tips/certificate — generate sertifikat (data untuk PDF)
router.get('/certificate', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const rank = await User.countDocuments({ ecoPoints: { $gt: user.ecoPoints } }) + 1;
    const level = user.totalScans >= 100 ? 'Eco Champion' : user.totalScans >= 50 ? 'Eco Warrior' : 'Eco Starter';

    res.json({
      name: user.name,
      ecoPoints: user.ecoPoints,
      totalScans: user.totalScans,
      carbonSaved: parseFloat((user.carbonSaved || 0).toFixed(1)),
      rank,
      level,
      badges: user.badges || [],
      issuedAt: new Date().toISOString(),
      eligible: user.ecoPoints >= 100 // minimum 100 poin untuk sertifikat
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data sertifikat.' });
  }
});

module.exports = router;
