const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  tel: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true,
    trim: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

schema.pre('save', async function () {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 10);
});
schema.methods.matchPassword = function (password) {
  return bcrypt.compare(password, this.password);
};
module.exports = mongoose.model('User', schema);
