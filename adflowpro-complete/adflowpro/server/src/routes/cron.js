import { Router } from 'express';
import { verifyCronSecret } from '../middlewares/auth.js';
import { publishScheduledAds, expireOutdatedAds, sendExpiryReminders, logDbHeartbeat } from '../cron/jobs.js';

const router = Router();
router.use(verifyCronSecret);

// POST /api/cron/publish-scheduled
router.post('/publish-scheduled', async (req, res, next) => {
  try {
    const result = await publishScheduledAds();
    res.json({ success: true, message: 'Scheduled ads published', ...result });
  } catch (err) { next(err); }
});

// POST /api/cron/expire-ads
router.post('/expire-ads', async (req, res, next) => {
  try {
    const result = await expireOutdatedAds();
    res.json({ success: true, message: 'Expired ads processed', ...result });
  } catch (err) { next(err); }
});

// POST /api/cron/expiry-reminders
router.post('/expiry-reminders', async (req, res, next) => {
  try {
    const result = await sendExpiryReminders();
    res.json({ success: true, message: 'Expiry reminders sent', ...result });
  } catch (err) { next(err); }
});

// POST /api/cron/heartbeat
router.post('/heartbeat', async (req, res, next) => {
  try {
    const result = await logDbHeartbeat();
    res.json({ success: true, message: 'Heartbeat logged', ...result });
  } catch (err) { next(err); }
});

export default router;
