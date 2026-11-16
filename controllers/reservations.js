const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const Restaurant = require('../models/Restaurant');
const restaurantDetails = { path: 'restaurant', select: 'name address tel openTime closeTime' };

function ownershipFilter(req, res) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    res.status(400).json({ success: false, message: 'Invalid reservation ID' });
    return null;
  }
  return req.user.role === 'admin'
    ? { _id: req.params.id }
    : { _id: req.params.id, user: req.user.id };
}
function notFound(res) {
  return res.status(404).json({ success: false, message: 'Reservation not found' });
}

exports.getReservations = async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { user: req.user.id };
  const reservations = await Reservation.find(filter)
    .populate(restaurantDetails).sort({ reservationDate: 1, _id: 1 });
  res.status(200).json({ success: true, count: reservations.length, data: reservations });
};
exports.getReservation = async (req, res) => {
  const filter = ownershipFilter(req, res);
  if (!filter) return;
  const reservation = await Reservation.findOne(filter).populate(restaurantDetails);
  if (!reservation) return notFound(res);
  res.status(200).json({ success: true, data: reservation });
};
exports.updateReservation = async (req, res) => {
  const filter = ownershipFilter(req, res);
  if (!filter) return;
  if (!await Reservation.exists(filter)) return notFound(res);
  const body = req.body;
  const allowed = ['reservationDate', 'tables', 'restaurant'];
  if (!body || Array.isArray(body) || !Object.keys(body).length ||
      Object.keys(body).some(key => !allowed.includes(key))) {
    return res.status(400).json({ success: false, message: 'Supply only reservationDate, tables or restaurant' });
  }
  const updates = {};
  if (Object.hasOwn(body, 'reservationDate')) {
    const value = body.reservationDate;
    const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(value + 'T00:00:00.000Z') : new Date(NaN);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      return res.status(400).json({ success: false, message: 'Use a valid reservationDate in YYYY-MM-DD format' });
    }
    updates.reservationDate = date;
  }
  if (Object.hasOwn(body, 'tables')) {
    if (!Number.isInteger(body.tables) || body.tables < 1 || body.tables > 3) {
      return res.status(400).json({ success: false, message: 'Reserve between 1 and 3 whole tables' });
    }
    updates.tables = body.tables;
  }
  if (Object.hasOwn(body, 'restaurant')) {
    if (!mongoose.isObjectIdOrHexString(body.restaurant)) {
      return res.status(400).json({ success: false, message: 'Invalid restaurant ID' });
    }
    if (!await Restaurant.exists({ _id: body.restaurant })) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    updates.restaurant = body.restaurant;
  }
  const reservation = await Reservation.findOneAndUpdate(filter, { $set: updates },
    { new: true, runValidators: true }).populate(restaurantDetails);
  if (!reservation) return notFound(res);
  res.status(200).json({ success: true, data: reservation });
};
exports.deleteReservation = async (req, res) => {
  const filter = ownershipFilter(req, res);
  if (!filter) return;
  const reservation = await Reservation.findOneAndDelete(filter);
  if (!reservation) return notFound(res);
  res.status(200).json({ success: true, data: {} });
};
