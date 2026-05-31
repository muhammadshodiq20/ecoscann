const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// GET profil
router.get('/profile', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

// PUT update profil
router.put('/profile', authMiddleware, [
  body('name').optional().trim().isLength({ min: 2, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { name } = req.body;
    const updates = {};
    if (name) updates.name = name;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ user, message: 'Profil berhasil diperbarui.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memperbarui profil.' });
  }
});

// PUT ganti password
router.put('/password', authMiddleware, [
  body('currentPassword').notEmpty().withMessage('Password lama wajib diisi'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password baru minimal 6 karakter')
    .matches(/\d/).withMessage('Password baru harus mengandung angka')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(req.body.currentPassword);
    if (!isMatch) return res.status(400).json({ error: 'Password lama tidak cocok.' });

    user.password = req.body.newPassword;
    await user.save();
    res.json({ message: 'Password berhasil diubah.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengubah password.' });
  }
});

module.exports = router;
