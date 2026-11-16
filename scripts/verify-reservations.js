require('dotenv').config({ path: require('node:path').join(__dirname, '../config/config.env'), quiet: true });
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Reservation = require('../models/Reservation');
const userId = new mongoose.Types.ObjectId();
const restaurantId = new mongoose.Types.ObjectId();
let server;
(async () => {
  await require('../config/db')();
  const user = await User.create({ _id: userId, name: 'Temporary Reservation Check', tel: '020000000',
    email: `reservation-${userId}@example.com`, password: 'TestPassword123!' });
  await Restaurant.create({ _id: restaurantId, name: 'Temporary Restaurant Check', address: 'Test Address',
    tel: '020000000', openTime: '10:00', closeTime: '22:00' });
  server = require('../app').listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1/restaurants`;
  const token = user.getSignedJwtToken();
  async function post(body, id = restaurantId, bearer = token) {
    const response = await fetch(`${base}/${id}/reservations`, { method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) },
      body: JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  }
  const list = await fetch(base);
  assert.equal(list.status, 200);
  const listed = (await list.json()).data.find(r => r._id === String(restaurantId));
  for (const field of ['name','address','tel','openTime','closeTime']) assert.ok(listed[field]);
  const data = { reservationDate: '2026-12-01', tables: 1 };
  assert.equal((await post(data, restaurantId, null)).status, 401);
  assert.equal((await post(data, restaurantId, 'invalid')).status, 401);
  assert.equal((await post(data, 'invalid')).status, 400);
  assert.equal((await post(data, new mongoose.Types.ObjectId())).status, 404);
  for (const tables of [0, 4, -1, 1.5, '2', undefined]) assert.equal((await post({ ...data, tables })).status, 400);
  for (const reservationDate of ['bad', '2026-02-30', undefined, '2026-12-01T12:00:00Z']) {
    assert.equal((await post({ ...data, reservationDate })).status, 400);
  }
  assert.equal(await Reservation.countDocuments({ user: userId }), 0);
  for (const tables of [1, 2, 3]) {
    const created = await post({ ...data, tables, user: new mongoose.Types.ObjectId(), restaurant: new mongoose.Types.ObjectId() });
    assert.equal(created.status, 201);
    assert.equal(created.body.data.user, String(userId));
    assert.equal(created.body.data.restaurant, String(restaurantId));
    const saved = await Reservation.findById(created.body.data._id);
    assert.equal(saved.tables, tables);
  }
  console.log('Requirement 3 passed: list details, auth, valid reservations, invalid input, missing restaurant, ownership and persistence.');
})().catch(err => { console.error(err.message); process.exitCode = 1; }).finally(async () => {
  if (mongoose.connection.readyState === 1) {
    await Reservation.deleteMany({ user: userId });
    await Restaurant.deleteOne({ _id: restaurantId });
    await User.deleteOne({ _id: userId });
  }
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
});
