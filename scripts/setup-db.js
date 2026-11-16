const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../config/config.env'), quiet: true });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const models = ['User', 'Restaurant', 'Reservation'].map(name => require(`../models/${name}`));

(async () => {
  await connectDB();
  for (const model of models) {
    await model.createCollection();
    await model.createIndexes();
  }
  console.log('restaurant_reservation database ready: users, restaurants, reservations.');
})().catch(error => {
  console.error('Database setup failed:', error.message.replace(/mongodb(?:\+srv)?:\/\/[^\s]+/g, '[redacted]'));
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
