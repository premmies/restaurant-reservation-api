const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Reservation = require('./Reservation');
const Restaurant = require('./Restaurant');
const values = { user: new mongoose.Types.ObjectId(), restaurant: new mongoose.Types.ObjectId(), reservationDate: '2026-12-01' };
test('allows one to three whole tables', async () => {
  for (const tables of [1, 2, 3]) await new Reservation({ ...values, tables }).validate();
});
test('rejects missing, zero, negative, fractional and excessive tables', async () => {
  for (const tables of [undefined, 0, -1, 1.5, 4]) {
    await assert.rejects(new Reservation({ ...values, tables }).validate());
  }
});
test('requires user, restaurant and date', async () => {
  for (const field of ['user', 'restaurant', 'reservationDate']) {
    await assert.rejects(new Reservation({ ...values, tables: 1, [field]: undefined }).validate());
  }
});
test('validates restaurant opening and closing time', async () => {
  const restaurant = { name: 'Example', address: 'Example Road', tel: '0123456789', openTime: '09:00', closeTime: '22:30' };
  await new Restaurant(restaurant).validate();
  for (const time of ['25:00', '09:60', '9am', undefined]) {
    await assert.rejects(new Restaurant({ ...restaurant, openTime: time }).validate());
  }
});
