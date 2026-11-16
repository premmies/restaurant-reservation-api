require('dotenv').config({ path: require('node:path').join(__dirname, '../config/config.env'), quiet: true });
const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
(async () => {
  await require('../config/db')();
  await Restaurant.updateOne({ _id: '000000000000000000000003' }, { $setOnInsert: {
    name: 'Demo Restaurant (fictional)', address: '123 Example Road, Bangkok',
    tel: '020000000', openTime: '10:00', closeTime: '22:00'
  } }, { upsert: true, runValidators: true });
  console.log('Demo restaurant ready.');
})().catch(() => { console.error('Demo setup failed. Check Atlas access.'); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
