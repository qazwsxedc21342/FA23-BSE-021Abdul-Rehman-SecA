import { Router } from 'express';
import supabase from '../db/supabase.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate, verifyPaymentSchema, publishAdSchema } from '../validators/schemas.js';
import { logAudit, logStatusChange } from '../services/auditService.js';
import { sendNotification } from '../services/notificationService.js';
import { updateRankScore } from '../services/rankService.js';
import { getIO } from '../utils/socket.js';

import { isDemoMode } from '../utils/runtime.js';

const router = Router();
router.use(authenticate, authorize('moderator', 'admin', 'superadmin'));

// GET /api/admin/payment-queue
router.get('/payment-queue', async (req, res, next) => {
  try {
    if (isDemoMode()) {
      return res.json({ success: true, data: [], count: 0 });
    }

    const { data, error } = await supabase
      .from('payments')
      .select(`
        id, amount, method, transaction_ref, sender_name, screenshot_url, status, created_at,
        ads(id, title, slug, user_id, status,
          users(name, email),
          packages(name, price)
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json({ success: true, data, count: data.length });
  } catch (err) { next(err); }
});

// PATCH /api/admin/payments/:id/verify
router.patch('/payments/:id/verify', validate(verifyPaymentSchema), async (req, res, next) => {
  try {
    const { action, note } = req.body;

    const { data: payment } = await supabase
      .from('payments')
      .select('*, ads(id, title, user_id, status)')
      .eq('id', req.params.id)
      .single();

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (payment.status !== 'pending') return res.status(400).json({ success: false, message: 'Payment already processed' });

    const paymentStatus = action === 'verify' ? 'verified' : 'rejected';
    const adStatus      = action === 'verify' ? 'payment_verified' : 'rejected';

    await supabase.from('payments').update({ status: paymentStatus, verified_by: req.user.id, verified_at: new Date().toISOString() }).eq('id', payment.id);
    await supabase.from('ads').update({ status: adStatus }).eq('id', payment.ads.id);

    await logStatusChange({ ad_id: payment.ads.id, previous_status: payment.ads.status, new_status: adStatus, changed_by: req.user.id, note });
    await logAudit({ actor_id: req.user.id, action_type: `PAYMENT_${action.toUpperCase()}`, target_type: 'payments', target_id: payment.id, old_value: { status: 'pending' }, new_value: { status: paymentStatus }, ip_address: req.ip });

    const notifMsg = action === 'verify'
      ? `Payment verified for "${payment.ads.title}". Your ad will be published shortly.`
      : `Payment rejected for "${payment.ads.title}". Reason: ${note || 'Invalid payment proof'}`;

    await sendNotification({ user_id: payment.ads.user_id, title: action === 'verify' ? 'Payment verified!' : 'Payment rejected', message: notifMsg, type: action === 'verify' ? 'success' : 'danger' });

    res.json({ success: true, message: `Payment ${action}d` });
  } catch (err) { next(err); }
});

// PATCH /api/admin/ads/:id/publish
router.patch('/ads/:id/publish', validate(publishAdSchema), async (req, res, next) => {
  try {
    const { action, publish_at, note } = req.body;

    const { data: ad } = await supabase.from('ads').select('*, packages(duration_days)').eq('id', req.params.id).single();
    if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });
    if (ad.status !== 'payment_verified') return res.status(400).json({ success: false, message: 'Ad payment not verified yet' });

    let newStatus;
    let publishAt;
    let expireAt;

    if (action === 'publish') {
      newStatus = 'published';
      publishAt = new Date().toISOString();
      const days  = ad.packages?.duration_days || 7;
      expireAt  = new Date(Date.now() + days * 86400000).toISOString();
    } else if (action === 'schedule') {
      newStatus = 'scheduled';
      publishAt = new Date(publish_at).toISOString();
      const days  = ad.packages?.duration_days || 7;
      expireAt  = new Date(new Date(publish_at).getTime() + days * 86400000).toISOString();
    } else {
      newStatus = 'rejected';
    }

    await supabase.from('ads').update({ status: newStatus, publish_at: publishAt, expire_at: expireAt }).eq('id', ad.id);
    await logStatusChange({ ad_id: ad.id, previous_status: ad.status, new_status: newStatus, changed_by: req.user.id, note });
    await logAudit({ actor_id: req.user.id, action_type: `AD_${action.toUpperCase()}`, target_type: 'ads', target_id: ad.id });

    if (newStatus === 'published') await updateRankScore(ad.id);

    await sendNotification({ user_id: ad.user_id, title: newStatus === 'published' ? 'Your ad is live!' : newStatus === 'scheduled' ? 'Ad scheduled' : 'Ad rejected', message: newStatus === 'published' ? `"${ad.title}" is now live on AdFlow Pro.` : `"${ad.title}" has been ${newStatus}.`, type: newStatus === 'published' ? 'success' : newStatus === 'scheduled' ? 'info' : 'danger' });

    getIO().emit('ad_updated', { id: ad.id, status: newStatus });

    res.json({ success: true, message: `Ad ${action}d`, data: { status: newStatus, publish_at: publishAt, expire_at: expireAt } });
  } catch (err) { next(err); }
});

// PATCH /api/admin/ads/:id/feature - Toggle featured
router.patch('/ads/:id/feature', async (req, res, next) => {
  try {
    const { data: ad } = await supabase.from('ads').select('id, is_featured, user_id, title').eq('id', req.params.id).single();
    if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });

    const newFeatured = !ad.is_featured;
    await supabase.from('ads').update({ is_featured: newFeatured }).eq('id', ad.id);
    await updateRankScore(ad.id);
    await logAudit({ actor_id: req.user.id, action_type: newFeatured ? 'AD_FEATURE' : 'AD_UNFEATURE', target_type: 'ads', target_id: ad.id });

    res.json({ success: true, message: `Ad ${newFeatured ? 'featured' : 'unfeatured'}` });
  } catch (err) { next(err); }
});

// PATCH /api/admin/ads/:id/boost - Set admin boost score
router.patch('/ads/:id/boost', async (req, res, next) => {
  try {
    const { boost = 0 } = req.body;
    await supabase.from('ads').update({ admin_boost: parseInt(boost) }).eq('id', req.params.id);
    await updateRankScore(req.params.id);
    res.json({ success: true, message: 'Boost applied' });
  } catch (err) { next(err); }
});

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    if (isDemoMode()) {
      return res.json({ success: true, data: [] });
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, status, created_at, seller_profiles(display_name, is_verified)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:id/verify
router.patch('/users/:id/verify', async (req, res, next) => {
  try {
    const { data: user } = await supabase.from('users').select('id, role').eq('id', req.params.id).single();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role !== 'client') return res.status(400).json({ success: false, message: 'Only clients can be verified' });

    await supabase.from('seller_profiles').update({ is_verified: true }).eq('user_id', req.params.id);
    await logAudit({ actor_id: req.user.id, action_type: 'USER_VERIFY', target_type: 'users', target_id: req.params.id, ip_address: req.ip });
    
    await sendNotification({ user_id: req.params.id, title: 'Account Verified!', message: 'Your account has been verified by an admin. You can now log in.', type: 'success' });

    res.json({ success: true, message: 'User verified successfully' });
  } catch(err) { next(err); }
});

// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active','suspended','banned'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    await supabase.from('users').update({ status }).eq('id', req.params.id);
    await logAudit({ actor_id: req.user.id, action_type: `USER_${status.toUpperCase()}`, target_type: 'users', target_id: req.params.id });
    res.json({ success: true, message: `User ${status}` });
  } catch (err) { next(err); }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', async (req, res, next) => {
  try {
    if (isDemoMode()) {
      return res.json({ success: true, data: [] });
    }

    const { data } = await supabase
      .from('audit_logs')
      .select('*, users(name, email)')
      .order('created_at', { ascending: false })
      .limit(100);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

export default router;
