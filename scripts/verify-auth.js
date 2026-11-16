const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../config/config.env'), quiet: true });
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const app = require('../app');
const email = `auth-check-${require('node:crypto').randomUUID()}@example.com`;
let server;
async function run() {
  await connectDB();
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1/auth`;
  async function request(route, body, token) {
    const response = await fetch(base + route, {
      method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie') };
  }
  const data = { name: 'Temporary Auth Check', tel: '0812345678', email, password: 'TestPassword123!', role: 'admin' };
  assert.equal((await request('/register', { ...data, tel: undefined })).status, 400);
  const registered = await request('/register', data);
  assert.equal(registered.status, 200);
  assert.ok(registered.body.token);
  assert.match(registered.cookie, /HttpOnly/i);
  const saved = await User.findOne({ email }).select('+password');
  assert.equal(saved.role, 'user');
  assert.notEqual(saved.password, data.password);
  assert.equal(await saved.matchPassword(data.password), true);
  assert.equal((await request('/register', data)).status, 400);
  assert.equal((await request('/login', { email })).status, 400);
  assert.equal((await request('/login', { email, password: 'incorrect' })).status, 401);
  const login = await request('/login', { email, password: data.password });
  assert.equal(login.status, 200);
  assert.ok(login.body.token);
  assert.equal((await request('/me')).status, 401);
  assert.equal((await request('/me', null, 'invalid')).status, 401);
  const me = await request('/me', null, login.body.token);
  assert.equal(me.status, 200);
  assert.equal(me.body.data.tel, data.tel);
  assert.equal(me.body.data.password, undefined);
  assert.equal((await request('/logout')).status, 401);
  const logout = await request('/logout', null, login.body.token);
  assert.equal(logout.status, 200);
  assert.match(logout.cookie, /token=none/);
  assert.equal((await request('/me', null, login.body.token)).status, 401);
  assert.equal((await request('/me', null, registered.body.token)).status, 401);
  const relogin = await request('/login', { email, password: data.password });
  assert.equal(relogin.status, 200);
  assert.equal((await request('/me', null, relogin.body.token)).status, 200);
  console.log('Auth integration passed: registration, telephone, password hashing, role safety, duplicate rejection, login, protected profile and logout.');
}
run().catch(err => { console.error(err.message); process.exitCode = 1; }).finally(async () => {
  if (mongoose.connection.readyState === 1) await User.deleteOne({ email });
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
});
