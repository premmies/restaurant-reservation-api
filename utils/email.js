const nodemailer = require('nodemailer');

let transporterPromise;

async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, SMTP_SECURE } = process.env;

    // Use Ethereal mock SMTP when no real SMTP_HOST is configured
    if (!SMTP_HOST || SMTP_HOST === 'smtp.example.com') {
      const testAccount = await nodemailer.createTestAccount();
      console.log(`[Mock Email] Using Ethereal test account: ${testAccount.user}`);
      return nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const port = Number(SMTP_PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65535 || !SMTP_FROM) {
      throw new Error('SMTP_HOST, a valid SMTP_PORT and SMTP_FROM are required');
    }
    if (Boolean(SMTP_USER) !== Boolean(SMTP_PASSWORD)) {
      throw new Error('SMTP_USER and SMTP_PASSWORD must both be configured');
    }

    const options = {
      host: SMTP_HOST,
      port,
      secure: SMTP_SECURE === 'true' || (SMTP_SECURE !== 'false' && port === 465),
    };
    if (SMTP_USER) options.auth = { user: SMTP_USER, pass: SMTP_PASSWORD };

    return nodemailer.createTransport(options);
  })();

  return transporterPromise;
}

exports.sendEmail = async ({ to, subject, text }) => {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Restaurant Reservations" <reservations@example.com>',
    to,
    subject,
    text,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[Mock Email Sent] To: ${to} | Subject: "${subject}"\n  Preview URL: ${previewUrl}`);
  }

  return info;
};