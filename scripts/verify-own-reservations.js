require('dotenv').config({ path: require('node:path').join(__dirname, '../config/config.env'), quiet: true });
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Reservation = require('../models/Reservation');
const users = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];
const restaurants = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];
let server;
(async () => {
  await require('../config/db')();
  const accounts = [];
  for (const _id of users) accounts.push(await User.create({ _id, name: 'Temporary Ownership Check',
    tel: '020000000', email: `ownership-${_id}@example.com`, password: 'TestPassword123!' }));
  for (const _id of restaurants) await Restaurant.create({ _id, name: 'Temporary Ownership Restaurant',
    address: 'Test Road', tel: '020000000', openTime: '09:00', closeTime: '22:00' });
  const records = [];
  for (const user of users) records.push(await Reservation.create({ user, restaurant: restaurants[0],
    reservationDate: '2026-12-01', tables: 1 }));
  server = require('../app').listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1/reservations`;
  const token = accounts[0].getSignedJwtToken();
  async function request(method, suffix = '', body, bearer = token) {
    const response = await fetch(base + suffix, { method,
      headers: { 'Content-Type': 'application/json', ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json() };
  }
  const own = '/' + records[0]._id;
  const other = '/' + records[1]._id;
  for (const [method, suffix, body] of [['GET', ''], ['GET', own], ['PUT', own, { tables: 2 }], ['DELETE', own]]) {
    assert.equal((await request(method, suffix, body, null)).status, 401);
  }
  const list = await request('GET', '?user=' + users[1]);
  assert.equal(list.status, 200);
  assert.equal(list.body.count, 1);
  assert.equal(list.body.data[0].user, String(users[0]));
  assert.ok(list.body.data[0].restaurant.openTime);
  assert.equal((await request('GET', own)).status, 200);
  for (const method of ['GET', 'PUT', 'DELETE']) {
    const body = method === 'PUT' ? { tables: 2 } : undefined;
    assert.equal((await request(method, other, body)).status, 404);
    assert.equal((await request(method, '/invalid', body)).status, 400);
    assert.equal((await request(method, '/' + new mongoose.Types.ObjectId(), body)).status, 404);
  }
  for (const body of [{}, { user: String(users[1]) }, { tables: 4 }, { tables: 0 }, { tables: 1.5 },
    { tables: '2' }, { tables: null }, { reservationDate: '2026-02-30' }, { reservationDate: null },
    { restaurant: 'bad' }, { _id: String(records[1]._id) }]) {
    assert.equal((await request('PUT', own, body)).status, 400);
  }
  assert.equal((await request('PUT', own, { restaurant: String(new mongoose.Types.ObjectId()) })).status, 404);
  assert.equal((await Reservation.findById(records[0]._id)).tables, 1);
  const updated = await request('PUT', own, { reservationDate: '2026-12-02', tables: 3, restaurant: String(restaurants[1]) });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.restaurant._id, String(restaurants[1]));
  assert.equal(updated.body.data.user, String(users[0]));
  const partial = await request('PUT', own, { tables: 2 });
  assert.equal(partial.status, 200);
  assert.equal(partial.body.data.reservationDate, '2026-12-02T00:00:00.000Z');
  const saved = await Reservation.findById(records[0]._id);
  assert.equal(saved.tables, 2);
  assert.equal(String(saved.restaurant), String(restaurants[1]));
  assert.equal((await request('DELETE', own)).status, 200);
  assert.equal(await Reservation.findById(records[0]._id), null);
  assert.equal((await request('GET', own)).status, 404);
  assert.equal((await request('DELETE', own)).status, 404);
  assert.equal((await request('GET')).body.count, 0);
  assert.equal((await Reservation.findById(records[1]._id)).tables, 1);
  console.log('Requirements 4-6 passed: own list/detail, edits, deletion, ownership isolation, validation, persistence and auth.');
})().catch(err => { console.error(err.message); process.exitCode = 1; }).finally(async () => {
  if (mongoose.connection.readyState === 1) {
    await Reservation.deleteMany({ user: { $in: users } });
    await Restaurant.deleteMany({ _id: { $in: restaurants } });
    await User.deleteMany({ _id: { $in: users } });
  }
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
});
