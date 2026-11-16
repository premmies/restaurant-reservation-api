const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  reservationDate: { type: Date, required: true },
  tables: { type: Number, required: true, min: 1, max: 3,
    validate: { validator: Number.isInteger, message: 'Tables must be a whole number' } }
}, { timestamps: true });
schema.index({ user: 1, reservationDate: 1 });
schema.index({ restaurant: 1, reservationDate: 1 });
module.exports = mongoose.model('Reservation', schema);
