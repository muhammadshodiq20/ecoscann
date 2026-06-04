// Fix DNS untuk Node.js v24 yang sering bermasalah dengan MongoDB Atlas
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const mongoose = require('mongoose');

const app = express();
app.set('trust proxy', 1);

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Terlalu banyak request, coba lagi setelah 15 menit.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Terlalu banyak percobaan login.' }
});

app.use(globalLimiter);
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Database ──────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecoscan', {
  serverSelectionTimeoutMS: 10000,
  family: 4,  // ← Fix utama: paksa IPv4, mengatasi bug DNS Node.js v24
})
  .then(() => console.log('✅ MongoDB terhubung'))
  .catch(err => {
    console.error('❌ MongoDB gagal terhubung:', err.message);
    process.exit(1);
  });

// ─── Routes ───────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/scan', require('./routes/scan'));
app.use('/api/food', require('./routes/food'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/user', require('./routes/user'));
app.use('/api/tips', require('./routes/tips'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err.message);
  // Multer errors (file too large, wrong type, etc)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Ukuran gambar terlalu besar. Maksimal 10MB.' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Field gambar tidak sesuai. Gunakan key "image".' });
  }
  if (err.message && err.message.includes('gambar')) {
    return res.status(400).json({ error: err.message });
  }
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Terjadi kesalahan server' : err.message
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route tidak ditemukan' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 EcoScan backend berjalan di http://localhost:${PORT}`);
  console.log(`📱 Akses dari HP: http://[IP-LAPTOP]:${PORT}`);
  console.log(`📋 Env: ${process.env.NODE_ENV || 'development'}`);
});
