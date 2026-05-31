const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { FoodItem } = require('../models/DataModels');

// GET semua item makanan user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const items = await FoodItem.find({
      userId: req.user._id,
      isConsumed: false
    }).sort({ expiryDate: 1 });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data stok.' });
  }
});

// POST tambah item baru
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, category, quantity, expiryDate } = req.body;
    if (!name) return res.status(400).json({ error: 'Nama item wajib diisi.' });

    const item = await FoodItem.create({
      userId: req.user._id,
      name,
      category: category || 'lainnya',
      quantity: quantity || '1',
      expiryDate: expiryDate ? new Date(expiryDate) : null
    });

    res.status(201).json({ item, message: 'Item berhasil ditambahkan.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menambahkan item.' });
  }
});

// PUT tandai sudah dikonsumsi
router.put('/:id/consume', authMiddleware, async (req, res) => {
  try {
    const item = await FoodItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isConsumed: true },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Item tidak ditemukan.' });
    res.json({ item, message: 'Item ditandai sudah dikonsumsi.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memperbarui item.' });
  }
});

// DELETE hapus item
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await FoodItem.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!item) return res.status(404).json({ error: 'Item tidak ditemukan.' });
    res.json({ message: 'Item dihapus.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus item.' });
  }
});

module.exports = router;
