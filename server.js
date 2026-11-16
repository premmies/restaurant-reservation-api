const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, 'config/config.env'), quiet: true });
const connectDB = require('./config/db');
const app = require('./app');
const port = process.env.PORT || 5001;
if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRE || !process.env.JWT_COOKIE_EXPIRE) {
  console.error('Set JWT_SECRET, JWT_EXPIRE and JWT_COOKIE_EXPIRE in config/config.env');
  process.exit(1);
}
connectDB().then(() => {
  const server = app.listen(port, () => console.log(`Restaurant API ready: http://localhost:${port}/api/v1/auth`));
  server.on('error', err => { console.error(`Server startup failed: ${err.code}`); process.exit(1); });
}).catch(() => { console.error('Database connection failed. Check MONGO_URI and Atlas IP access.'); process.exit(1); });
