import supabase from '../db/supabase.js';
import { logStatusChange } from '../services/auditService.js';
import { sendNotification } from '../services/notificationService.js';
import { updateRankScore } from '../services/rankService.js';

// ─── Publish scheduled ads whose publish_at has passed ───────
export const publishScheduledAds = async () => {
  const now = new Date().toISOString();

  const { data: ads, error } = await supabase
    .from('ads')
    .select('id, title, user_id, package_id, packages(duration_days)')
    .eq('status', 'scheduled')
    .lte('publish_at', now);

  if (error) { console.error('[CRON] publishScheduledAds error:', error); return { published: 0 }; }
  if (!ads.length) { console.log('[CRON] No scheduled ads to publish'); return { published: 0 }; }

  let published = 0;
  for (const ad of ads) {
    const days     = ad.packages?.duration_days || 7;
    const expireAt = new Date(Date.now() + days * 86400000).toISOString();

    await supabase.from('ads').update({ status: 'published', expire_at: expireAt }).eq('id', ad.id);
    await logStatusChange({ ad_id: ad.id, previous_status: 'scheduled', new_status: 'published', note: 'Auto-published by scheduler' });
    await updateRankScore(ad.id);
    await sendNotification({ user_id: ad.user_id, title: 'Your ad is now live!', message: `"${ad.title}" has been published and is now visible to buyers.`, type: 'success' });

    published++;
    console.log(`[CRON] Published ad: ${ad.id}`);
  }

  await supabase.from('system_health_logs').insert({ source: 'cron_publish', status: 'ok', message: `Published ${published} ads` });
  return { published };
};

// ─── Expire ads whose expire_at has passed ───────────────────
export const expireOutdatedAds = async () => {
  const now = new Date().toISOString();

  const { data: ads, error } = await supabase
    .from('ads')
    .select('id, title, user_id')
    .eq('status', 'published')
    .lt('expire_at', now);

  if (error) { console.error('[CRON] expireOutdatedAds error:', error); return { expired: 0 }; }
  if (!ads.length) { console.log('[CRON] No ads to expire'); return { expired: 0 }; }

  let expired = 0;
  for (const ad of ads) {
    await supabase.from('ads').update({ status: 'expired' }).eq('id', ad.id);
    await logStatusChange({ ad_id: ad.id, previous_status: 'published', new_status: 'expired', note: 'Auto-expired by scheduler' });
    await sendNotification({ user_id: ad.user_id, title: 'Ad expired', message: `"${ad.title}" has expired. Renew your listing to keep it visible.`, type: 'warning', link: '/client/dashboard' });

    expired++;
    console.log(`[CRON] Expired ad: ${ad.id}`);
  }

  await supabase.from('system_health_logs').insert({ source: 'cron_expire', status: 'ok', message: `Expired ${expired} ads` });
  return { expired };
};

// ─── Send 48-hour expiry reminders ──────────────────────────
export const sendExpiryReminders = async () => {
  const in48h = new Date(Date.now() + 48 * 3600000).toISOString();
  const now   = new Date().toISOString();

  const { data: ads, error } = await supabase
    .from('ads')
    .select('id, title, user_id, expire_at')
    .eq('status', 'published')
    .lte('expire_at', in48h)
    .gte('expire_at', now);

  if (error) { console.error('[CRON] sendExpiryReminders error:', error); return { reminders: 0 }; }

  let reminders = 0;
  for (const ad of ads) {
    await sendNotification({
      user_id: ad.user_id,
      title:   'Ad expiring soon',
      message: `"${ad.title}" expires in less than 48 hours. Renew now to keep it live.`,
      type:    'warning',
      link:    '/client/dashboard',
    });
    reminders++;
  }

  await supabase.from('system_health_logs').insert({ source: 'cron_reminders', status: 'ok', message: `Sent ${reminders} expiry reminders` });
  return { reminders };
};

// ─── DB heartbeat log ────────────────────────────────────────
export const logDbHeartbeat = async () => {
  const start = Date.now();
  try {
    await supabase.from('users').select('id').limit(1);
    const ms = Date.now() - start;
    await supabase.from('system_health_logs').insert({ source: 'cron_heartbeat', response_ms: ms, status: 'ok', message: 'DB heartbeat OK' });
    console.log(`[CRON] Heartbeat OK — ${ms}ms`);
    return { response_ms: ms, status: 'ok' };
  } catch (err) {
    await supabase.from('system_health_logs').insert({ source: 'cron_heartbeat', status: 'error', message: err.message });
    return { status: 'error' };
  }
};
