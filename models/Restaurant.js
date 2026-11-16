const mongoose = require('mongoose');
const time = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
module.exports = mongoose.model('Restaurant', new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  tel: { type: String, required: true, trim: true },
  openTime: { type: String, required: true, match: time },
  closeTime: { type: String, required: true, match: time }
}, { timestamps: true }));
