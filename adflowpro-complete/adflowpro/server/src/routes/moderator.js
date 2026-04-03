import { Router } from 'express';
import supabase from '../db/supabase.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate, reviewSchema } from '../validators/schemas.js';
import { logAudit, logStatusChange } from '../services/auditService.js';
import { sendNotification } from '../services/notificationService.js';
import { getIO } from '../utils/socket.js';

import { isDemoMode } from '../utils/runtime.js';

const router = Router();
router.use(authenticate, authorize('moderator', 'admin', 'superadmin'));

// GET /api/moderator/pending-users
router.get('/pending-users', async (req, res, next) => {
  try {
    if (isDemoMode()) {
      return res.json({ success: true, data: [], count: 0 });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, created_at, seller_profiles!inner(is_verified, display_name)')
      .eq('role', 'client')
      .eq('seller_profiles.is_verified', false)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    res.json({ success: true, data: users, count: users.length });
  } catch (err) { next(err); }
});

// PATCH /api/moderator/users/:id/verify
router.patch('/users/:id/verify', async (req, res, next) => {
  try {
    const { data: user } = await supabase.from('users').select('id, role').eq('id', req.params.id).single();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role !== 'client') return res.status(400).json({ success: false, message: 'Only clients can be verified' });

    await supabase.from('seller_profiles').update({ is_verified: true }).eq('user_id', req.params.id);
    await logAudit({ actor_id: req.user.id, action_type: 'USER_VERIFY', target_type: 'users', target_id: req.params.id, ip_address: req.ip });
    
    await sendNotification({ user_id: req.params.id, title: 'Account Verified!', message: 'Your account has been verified. You can now log in and post ads.', type: 'success' });

    res.json({ success: true, message: 'User verified successfully' });
  } catch(err) { next(err); }
});

// GET /api/moderator/review-queue
router.get('/review-queue', async (req, res, next) => {
  try {
    if (isDemoMode()) {
      return res.json({ success: true, data: [], count: 0 });
    }

    const { data, error } = await supabase
      .from('ads')
      .select(`
        id, title, slug, description, status, created_at,
        categories(name), cities(name),
        users(id, name, email),
        seller_profiles(display_name, is_verified),
        ad_media(source_type, original_url, thumbnail_url, validation_status)
      `)
      .in('status', ['submitted'])
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json({ success: true, data, count: data.length });
  } catch (err) { next(err); }
});

// PATCH /api/moderator/ads/:id/review
router.patch('/ads/:id/review', validate(reviewSchema), async (req, res, next) => {
  try {
    const { action, note } = req.body;
    const { data: ad } = await supabase.from('ads').select('*').eq('id', req.params.id).single();
    if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });
    if (ad.status !== 'submitted') return res.status(400).json({ success: false, message: 'Ad is not in submitted state' });

    let newStatus;
    let notifTitle;
    let notifMsg;
    let notifType;

    if (action === 'approve') {
      newStatus  = 'payment_pending';
      notifTitle = 'Ad approved by moderator';
      notifMsg   = `Your ad "${ad.title}" passed review. Please select a package and submit payment.`;
      notifType  = 'success';
    } else if (action === 'reject') {
      newStatus  = 'rejected';
      notifTitle = 'Ad rejected';
      notifMsg   = `Your ad "${ad.title}" was rejected. Reason: ${note || 'Content policy violation'}`;
      notifType  = 'danger';
    } else {
      // flag - stay in submitted but add a note
      newStatus  = 'submitted';
      notifTitle = 'Ad flagged for review';
      notifMsg   = `Your ad "${ad.title}" has been flagged for further review.`;
      notifType  = 'warning';
    }

    if (newStatus !== 'submitted') {
      await supabase.from('ads').update({ status: newStatus }).eq('id', ad.id);
    }

    await logStatusChange({ ad_id: ad.id, previous_status: ad.status, new_status: newStatus, changed_by: req.user.id, note });
    await logAudit({ actor_id: req.user.id, action_type: `AD_${action.toUpperCase()}`, target_type: 'ads', target_id: ad.id, old_value: { status: ad.status }, new_value: { status: newStatus }, ip_address: req.ip });
    await sendNotification({ user_id: ad.user_id, title: notifTitle, message: notifMsg, type: notifType, link: `/client/ads/${ad.id}` });

    // ─── Trigger Real-Time Feed Update
    getIO().emit('ad_updated', { id: ad.id, status: newStatus });

    res.json({ success: true, message: `Ad ${action}d successfully` });
  } catch (err) { next(err); }
});

export default router;
