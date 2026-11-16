const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const Reservation = require('../models/Reservation');

// GET /api/v1/restaurants
exports.getRestaurants = async (req, res) => {
  const restaurants = await Restaurant.find()
    .select('name address tel openTime closeTime').sort({ name: 1, _id: 1 });
  res.status(200).json({ success: true, count: restaurants.length, data: restaurants });
};

// POST /api/v1/restaurants/:restaurantId/reservations
exports.createReservation = async (req, res) => {
  const { restaurantId } = req.params;
  if (!mongoose.isObjectIdOrHexString(restaurantId)) {
    return res.status(400).json({ success: false, message: 'Invalid restaurant ID' });
  }
  const { reservationDate, tables } = req.body || {};
  // Accept actual calendar dates, rather than JS Date's normalization of impossible dates.
  if (typeof reservationDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(reservationDate)) {
    return res.status(400).json({ success: false, message: 'reservationDate must use YYYY-MM-DD' });
  }
  const date = new Date(reservationDate + 'T00:00:00.000Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== reservationDate) {
    return res.status(400).json({ success: false, message: 'Invalid reservation date' });
  }
  if (!Number.isInteger(tables) || tables < 1 || tables > 3) {
    return res.status(400).json({ success: false, message: 'Reserve between 1 and 3 whole tables' });
  }
  if (!await Restaurant.exists({ _id: restaurantId })) {
    return res.status(404).json({ success: false, message: 'Restaurant not found' });
  }
  const reservation = await Reservation.create({
    user: req.user.id,
    restaurant: restaurantId,
    reservationDate: date,
    tables
  });
  res.status(201).json({ success: true, data: reservation });
};
