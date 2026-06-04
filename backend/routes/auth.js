const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ─── POST /api/auth/register ───────────────────────────────────────
router.post('/register', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nama harus 2-50 karakter'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Format email tidak valid'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password minimal 6 karakter')
    .matches(/\d/)
    .withMessage('Password harus mengandung minimal 1 angka')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: errors.array()[0].msg
      });
    }

    const { name, email, password } = req.body;

    // Cek email sudah ada
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email sudah terdaftar. Gunakan email lain.' });
    }

    // Buat user baru
    const user = await User.create({ name, email, password });

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      message: 'Akun berhasil dibuat!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        ecoPoints: user.ecoPoints,
        carbonSaved: user.carbonSaved,
        totalScans: user.totalScans,
        badges: user.badges
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Gagal membuat akun. Coba lagi.' });
  }
});

// ─── POST /api/auth/login ──────────────────────────────────────────
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Format email tidak valid'),
  body('password').notEmpty().withMessage('Password wajib diisi')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    // Cari user + ambil password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    // Cek apakah akun aktif
    if (!user.isActive) {
      return res.status(401).json({ error: 'Akun tidak aktif. Hubungi admin.' });
    }

    // Verifikasi password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    const token = generateToken(user._id);

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({
      message: 'Login berhasil!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        ecoPoints: user.ecoPoints,
        carbonSaved: user.carbonSaved,
        totalScans: user.totalScans,
        badges: user.badges
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.user._id)
      .select('-password');
    res.json({ user });
  } catch (err) {
    res.json({ user: req.user });
  }
});

// ─── POST /api/auth/logout ─────────────────────────────────────────
router.post('/logout', authMiddleware, (req, res) => {
  // JWT stateless — client hapus token dari storage
  res.json({ message: 'Logout berhasil.' });
});

module.exports = router;
