const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, SMTP_SECURE } = process.env;
  const port = Number(SMTP_PORT);
  if (!SMTP_HOST || !Number.isInteger(port) || port < 1 || port > 65535 || !SMTP_FROM) {
    throw new Error('SMTP_HOST, a valid SMTP_PORT and SMTP_FROM are required');
  }
  if (Boolean(SMTP_USER) !== Boolean(SMTP_PASSWORD)) {
    throw new Error('SMTP_USER and SMTP_PASSWORD must both be configured');
  }

  const options = {
    host: SMTP_HOST,
    port,
    secure: SMTP_SECURE === 'true' || (SMTP_SECURE !== 'false' && port === 465)
  };
  if (SMTP_USER) options.auth = { user: SMTP_USER, pass: SMTP_PASSWORD };

  transporter = nodemailer.createTransport(options);
  return transporter;
}

exports.sendEmail = async ({ to, subject, text }) => getTransporter().sendMail({
  from: process.env.SMTP_FROM,
  to,
  subject,
  text
});
