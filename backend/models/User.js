const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  avatar: { type: String, default: null },
  ecoPoints: { type: Number, default: 0 },
  carbonSaved: { type: Number, default: 0 },
  totalScans: { type: Number, default: 0 },
  badges: [{ id: String, name: String, emoji: String, earnedAt: Date }],
  completedTips: [{ type: Number }],       // array tip ID yang sudah ditandai selesai
  completedChallenges: [{ type: Number }], // array challenge ID yang sudah selesai
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(pwd) {
  return await bcrypt.compare(pwd, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
