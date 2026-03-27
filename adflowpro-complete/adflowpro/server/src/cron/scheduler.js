import cron from 'node-cron';
import { publishScheduledAds, expireOutdatedAds, sendExpiryReminders, logDbHeartbeat } from './jobs.js';

// Publish scheduled ads — every hour
cron.schedule('0 * * * *', async () => {
  console.log('[CRON] Running: publishScheduledAds');
  await publishScheduledAds();
});

// Expire outdated ads — daily at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('[CRON] Running: expireOutdatedAds');
  await expireOutdatedAds();
});

// Expiry reminders — daily at 9am
cron.schedule('0 9 * * *', async () => {
  console.log('[CRON] Running: sendExpiryReminders');
  await sendExpiryReminders();
});

// DB heartbeat — every 5 minutes (keeps Supabase connection alive)
cron.schedule('*/5 * * * *', async () => {
  await logDbHeartbeat();
});

console.log('✅ Cron scheduler initialized');
