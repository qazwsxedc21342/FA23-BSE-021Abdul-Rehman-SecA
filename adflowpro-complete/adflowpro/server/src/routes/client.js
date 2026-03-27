import { Router } from 'express';
import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../db/supabase.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate, createAdSchema, updateAdSchema, paymentSchema } from '../validators/schemas.js';
import { normalizeMediaArray } from '../services/mediaService.js';
import { logAudit, logStatusChange } from '../services/auditService.js';
import { sendNotification } from '../services/notificationService.js';

import { isDemoMode } from '../utils/runtime.js';

const router = Router();
router.use(authenticate, authorize('client'));

// GET /api/client/dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    if (isDemoMode()) {
      return res.json({
        success: true,
        data: {
          ads: [],
          summary: { total: 0, active: 0, pending: 0, rejected: 0, expired: 0 },
          notifications: []
        }
      });
    }

    const { data: ads, error } = await supabase
      .from('ads')
      .select(`
        id, title, slug, status, rank_score, is_featured, publish_at, expire_at, created_at,
        categories(name), cities(name), packages(name, price),
        ad_media(thumbnail_url),
        payments(status, amount, method, transaction_ref)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const summary = {
      total:    ads.length,
      active:   ads.filter(a => a.status === 'published').length,
      pending:  ads.filter(a => ['submitted','under_review','payment_pending','payment_submitted','payment_verified','scheduled'].includes(a.status)).length,
      rejected: ads.filter(a => a.status === 'rejected').length,
      expired:  ads.filter(a => a.status === 'expired').length,
    };

    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({ success: true, data: { ads, summary, notifications } });
  } catch (err) { next(err); }
});

// POST /api/client/ads - Create ad draft
router.post('/ads', validate(createAdSchema), async (req, res, next) => {
  try {
    const { title, description, price, category_id, city_id, media_urls = [] } = req.body;

    const slug = slugify(title, { lower: true, strict: true }) + '-' + uuidv4().slice(0, 8);

    const { data: ad, error } = await supabase
      .from('ads')
      .insert({ user_id: req.user.id, title, slug, description, price, category_id, city_id, status: 'draft' })
      .select()
      .single();

    if (error) throw error;

    // Normalize and store media
    if (media_urls.length > 0) {
      const mediaRecords = normalizeMediaArray(media_urls, ad.id);
      await supabase.from('ad_media').insert(mediaRecords);
    }

    await logStatusChange({ ad_id: ad.id, previous_status: null, new_status: 'draft', changed_by: req.user.id });
    await logAudit({ actor_id: req.user.id, action_type: 'AD_CREATE', target_type: 'ads', target_id: ad.id });

    res.status(201).json({ success: true, message: 'Ad draft created', data: ad });
  } catch (err) { next(err); }
});

// PATCH /api/client/ads/:id - Edit draft
router.patch('/ads/:id', validate(updateAdSchema), async (req, res, next) => {
  try {
    // Ensure ad belongs to user and is in editable state
    const { data: existing } = await supabase.from('ads').select('id, status, user_id').eq('id', req.params.id).single();
    if (!existing) return res.status(404).json({ success: false, message: 'Ad not found' });
    if (existing.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Not your ad' });
    if (!['draft', 'rejected'].includes(existing.status)) {
      return res.status(400).json({ success: false, message: 'Only drafts or rejected ads can be edited' });
    }

    const { media_urls, ...adFields } = req.body;

    const { data: updated, error } = await supabase
      .from('ads')
      .update({ ...adFields, status: 'draft' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    if (media_urls) {
      await supabase.from('ad_media').delete().eq('ad_id', req.params.id);
      const mediaRecords = normalizeMediaArray(media_urls, req.params.id);
      await supabase.from('ad_media').insert(mediaRecords);
    }

    await logAudit({ actor_id: req.user.id, action_type: 'AD_UPDATE', target_type: 'ads', target_id: req.params.id });
    res.json({ success: true, message: 'Ad updated', data: updated });
  } catch (err) { next(err); }
});

// POST /api/client/ads/:id/submit - Submit draft for review
router.post('/ads/:id/submit', async (req, res, next) => {
  try {
    const { data: ad } = await supabase.from('ads').select('*').eq('id', req.params.id).eq('user_id', req.user.id).single();
    if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });
    if (ad.status !== 'draft') return res.status(400).json({ success: false, message: 'Only drafts can be submitted' });

    await supabase.from('ads').update({ status: 'submitted' }).eq('id', ad.id);
    await logStatusChange({ ad_id: ad.id, previous_status: 'draft', new_status: 'submitted', changed_by: req.user.id });
    await logAudit({ actor_id: req.user.id, action_type: 'AD_SUBMIT', target_type: 'ads', target_id: ad.id });

    res.json({ success: true, message: 'Ad submitted for review' });
  } catch (err) { next(err); }
});

// POST /api/client/payments - Submit payment proof
router.post('/payments', validate(paymentSchema), async (req, res, next) => {
  try {
    const { ad_id, package_id, method, transaction_ref, sender_name, screenshot_url } = req.body;

    // Verify ad ownership and status
    const { data: ad } = await supabase.from('ads').select('*').eq('id', ad_id).eq('user_id', req.user.id).single();
    if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });
    if (ad.status !== 'payment_pending') return res.status(400).json({ success: false, message: 'Ad is not awaiting payment' });

    // Check duplicate transaction ref
    const { data: dupPay } = await supabase.from('payments').select('id').eq('transaction_ref', transaction_ref).single();
    if (dupPay) return res.status(409).json({ success: false, message: 'Duplicate transaction reference' });

    // Get package price
    const { data: pkg } = await supabase.from('packages').select('price').eq('id', package_id).single();
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });

    const { data: payment, error } = await supabase
      .from('payments')
      .insert({ ad_id, amount: pkg.price, method, transaction_ref, sender_name, screenshot_url, status: 'pending' })
      .select()
      .single();

    if (error) throw error;

    // Update ad status and package
    await supabase.from('ads').update({ status: 'payment_submitted', package_id }).eq('id', ad_id);
    await logStatusChange({ ad_id, previous_status: 'payment_pending', new_status: 'payment_submitted', changed_by: req.user.id });
    await logAudit({ actor_id: req.user.id, action_type: 'PAYMENT_SUBMIT', target_type: 'payments', target_id: payment.id });
    await sendNotification({ user_id: req.user.id, title: 'Payment submitted', message: 'Your payment proof is under review.', type: 'info' });

    res.status(201).json({ success: true, message: 'Payment submitted, awaiting admin verification', data: payment });
  } catch (err) { next(err); }
});

// GET /api/client/notifications
router.get('/notifications', async (req, res, next) => {
  try {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false }).limit(20);
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', req.user.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

export default router;
