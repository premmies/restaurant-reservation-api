const email = require('./email');

exports.sendNotifications = async messages => {
  const results = await Promise.allSettled(
    messages.map(message => Promise.resolve().then(() => email.sendEmail(message)))
  );
  const failedCount = results.filter(result => result.status === 'rejected').length;
  if (failedCount) console.error(`Email delivery failed for ${failedCount} notification(s).`);
  return { sentCount: results.length - failedCount, failedCount };
};
