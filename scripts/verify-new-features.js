const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../config/config.env'), quiet: true });
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Reservation = require('../models/Reservation');
const emailService = require('../utils/email');
const sentEmails = [];
const originalSendEmail = emailService.sendEmail;
emailService.sendEmail = async message => {
  sentEmails.push(message);
  return { accepted: [message.to] };
};
const app = require('../app');
const suffix = require('node:crypto').randomUUID();
let owner;
let admin;
let restaurant;
let reservation;
let server;

async function request(base, route, method = 'GET', token, body) {
  const response = await fetch(base + route, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return { status: response.status, body: await response.json() };
}

async function run() {
  await connectDB();
  owner = await User.create({
    name: 'Feature Test Owner',
    tel: '0812345678',
    email: `feature-owner-${suffix}@example.com`,
    password: 'TestPassword123!'
  });
  admin = await User.create({
    name: 'Feature Test Admin',
    tel: '0812345678',
    email: `feature-admin-${suffix}@example.com`,
    password: 'TestPassword123!',
    role: 'admin'
  });
  restaurant = await Restaurant.create({
    name: `Feature Test Restaurant ${suffix}`,
    address: 'Test Road',
    tel: '0812345678',
    openTime: '09:00',
    closeTime: '22:00'
  });
  reservation = await Reservation.create({
    user: owner._id,
    restaurant: restaurant._id,
    reservationDate: '2026-12-01',
    tables: 1
  });

  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  const ownerToken = owner.getSignedJwtToken();
  const adminToken = admin.getSignedJwtToken();
  const newEmail = `feature-new-${suffix}@example.com`;

  assert.equal((await request(base, '/admin/reservation-metrics')).status, 401);
  assert.equal((await request(base, '/admin/reservation-metrics', 'GET', ownerToken)).status, 403);
  const metrics = await request(base, '/admin/reservation-metrics', 'GET', adminToken);
  assert.equal(metrics.status, 200);
  assert.ok(metrics.body.data.totalReservations >= 1);
  assert.ok(metrics.body.data.reservationsPerDay.some(day => day._id === '2026-12-01'));
  assert.ok(metrics.body.data.peakBookingHours.some(hour => hour.hourUtc === reservation.createdAt.getUTCHours()));
  assert.ok(metrics.body.data.mostPopularRestaurants.some(item => item.restaurantName === restaurant.name));

  const duplicateEmail = await request(base, '/auth/email', 'PATCH', ownerToken, { email: admin.email });
  assert.equal(duplicateEmail.status, 409);
  const changedEmail = await request(base, '/auth/email', 'PATCH', ownerToken, { email: newEmail });
  assert.equal(changedEmail.status, 200);
  assert.equal(changedEmail.body.data.email, newEmail);
  assert.deepEqual(sentEmails.slice(0, 2).map(message => message.to).sort(),
    [owner.email, newEmail].sort());
  assert.equal((await request(base, '/auth/login', 'POST', undefined, {
    email: owner.email, password: 'TestPassword123!'
  })).status, 400);
  assert.equal((await request(base, '/auth/login', 'POST', undefined, {
    email: newEmail, password: 'TestPassword123!'
  })).status, 200);

  const edited = await request(base, `/reservations/${reservation._id}`, 'PUT', ownerToken, { tables: 2 });
  assert.equal(edited.status, 200);
  assert.equal(edited.body.data.tables, 2);
  assert.equal(sentEmails[2].to, newEmail);
  assert.match(sentEmails[2].subject, /reservation was updated/i);

  console.log('Feature checks passed: admin reservation metrics, email change notifications, and reservation edit notifications.');
}

run().catch(err => {
  console.error(err);
  process.exitCode = 1;
}).finally(async () => {
  emailService.sendEmail = originalSendEmail;
  if (mongoose.connection.readyState === 1) {
    if (owner) await Reservation.deleteMany({ user: owner._id });
    if (restaurant) await Restaurant.deleteOne({ _id: restaurant._id });
    if (owner) await User.deleteOne({ _id: owner._id });
    if (admin) await User.deleteOne({ _id: admin._id });
  }
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
});
