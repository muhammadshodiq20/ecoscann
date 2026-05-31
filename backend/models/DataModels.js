const mongoose = require('mongoose');

// ─── Scan History ──────────────────────────────────────────────────
const scanHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  wasteType: {
    type: String,
    required: true,
    enum: ['plastik', 'organik', 'kertas', 'logam', 'kaca', 'b3', 'elektronik', 'tekstil']
  },
  confidence: { type: Number },
  carbonScore: { type: Number, default: 0 },
  imageUrl: { type: String, default: null },
  steps: [{ type: String }],
  location: {
    lat: Number,
    lng: Number
  }
}, { timestamps: true });

// ─── Food Item ─────────────────────────────────────────────────────
const foodItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['protein', 'sayur', 'buah', 'dairy', 'karbohidrat', 'bumbu', 'minuman', 'lainnya'],
    default: 'lainnya'
  },
  quantity: { type: String, default: '1' },
  expiryDate: { type: Date },
  scanDate: { type: Date, default: Date.now },
  isConsumed: { type: Boolean, default: false },
  carbonFootprint: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = {
  ScanHistory: mongoose.model('ScanHistory', scanHistorySchema),
  FoodItem: mongoose.model('FoodItem', foodItemSchema)
};
