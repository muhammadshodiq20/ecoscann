const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { ScanHistory } = require('../models/DataModels');

// GET statistik user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // Agregasi per jenis sampah bulan ini
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [wasteBreakdown, monthlyScan, totalScans] = await Promise.all([
      ScanHistory.aggregate([
        { $match: { userId, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: '$wasteType', count: { $sum: 1 }, totalCarbon: { $sum: '$carbonScore' } } },
        { $sort: { count: -1 } }
      ]),
      ScanHistory.countDocuments({ userId, createdAt: { $gte: startOfMonth } }),
      ScanHistory.countDocuments({ userId })
    ]);

    // Scan per hari 7 hari terakhir
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyScans = await ScanHistory.aggregate([
      { $match: { userId, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      wasteBreakdown,
      monthlyScan,
      totalScans,
      dailyScans,
      ecoPoints: req.user.ecoPoints,
      carbonSaved: req.user.carbonSaved
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil statistik.' });
  }
});

module.exports = router;
