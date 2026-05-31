const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nama wajib diisi'],
    trim: true,
    minlength: [2, 'Nama minimal 2 karakter'],
    maxlength: [50, 'Nama maksimal 50 karakter']
  },
  email: {
    type: String,
    required: [true, 'Email wajib diisi'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Format email tidak valid']
  },
  password: {
    type: String,
    required: [true, 'Password wajib diisi'],
    minlength: [6, 'Password minimal 6 karakter'],
    select: false  // Tidak ikut di-return query default
  },
  avatar: {
    type: String,
    default: null
  },
  ecoPoints: {
    type: Number,
    default: 0
  },
  carbonSaved: {
    type: Number,
    default: 0
  },
  totalScans: {
    type: Number,
    default: 0
  },
  badges: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password sebelum disimpan
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method cek password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Jangan return password
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
