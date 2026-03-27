import { Router } from 'express';
import supabase from '../db/supabase.js';
import { authenticate, authorize } from '../middlewares/auth.js';

import { isDemoMode } from '../utils/runtime.js';

const router = Router();
router.use(authenticate, authorize('admin', 'superadmin'));

// GET /api/analytics/summary
router.get('/summary', async (req, res, next) => {
  try {
    if (isDemoMode()) {
      return res.json({
        success: true,
        data: {
          listings: { total: 42, active: 25, pending: 10, expired: 5, rejected: 2 },
          revenue: { 
            total: 154500, 
            pending: 12000, 
            monthly: { 'Jan 26': 12000, 'Feb 26': 28000, 'Mar 26': 45000 } 
          },
          moderation: { approved: 85, rejected: 15, approvalRate: 85, rejectionRate: 15 },
          taxonomy: { 
            byCategory: { 'Electronics': 12, 'Real Estate': 8, 'Vehicles': 5 },
            byCity: { 'Karachi': 15, 'Lahore': 10, 'Islamabad': 5 },
            byPackage: { 'Basic': 20, 'Standard': 15, 'Premium': 7 }
          },
          systemHealth: [
            { source: 'demo_db', status: 'ok', response_ms: 12, checked_at: new Date().toISOString() }
          ],
        },
      });
    }

    // Listings stats
    const { data: ads } = await supabase.from('ads').select('status, created_at');
    const total    = ads.length;
    const active   = ads.filter(a => a.status === 'published').length;
    const pending  = ads.filter(a => ['submitted','under_review','payment_pending','payment_submitted','payment_verified','scheduled'].includes(a.status)).length;
    const expired  = ads.filter(a => a.status === 'expired').length;
    const rejected = ads.filter(a => a.status === 'rejected').length;

    // Revenue
    const { data: payments } = await supabase.from('payments').select('amount, status, created_at');
    const verifiedPayments = payments.filter(p => p.status === 'verified');
    const totalRevenue     = verifiedPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const pendingPayments  = payments.filter(p => p.status === 'pending').length;

    // Monthly revenue (last 6 months)
    const monthlyRevenue = {};
    verifiedPayments.forEach(p => {
      const month = new Date(p.created_at).toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + parseFloat(p.amount);
    });

    // Moderation stats
    const { data: history } = await supabase.from('ad_status_history').select('new_status');
    const approved     = history.filter(h => h.new_status === 'payment_pending').length;
    const rejectedMod  = history.filter(h => h.new_status === 'rejected').length;
    const totalReviewed = approved + rejectedMod;
    const approvalRate  = totalReviewed ? Math.round((approved / totalReviewed) * 100) : 0;

    // Ads by category
    const { data: catAds } = await supabase.from('ads').select('categories(name)').eq('status', 'published');
    const byCategory = {};
    catAds.forEach(a => {
      const name = a.categories?.name || 'Unknown';
      byCategory[name] = (byCategory[name] || 0) + 1;
    });

    // Ads by city
    const { data: cityAds } = await supabase.from('ads').select('cities(name)').eq('status', 'published');
    const byCity = {};
    cityAds.forEach(a => {
      const name = a.cities?.name || 'Unknown';
      byCity[name] = (byCity[name] || 0) + 1;
    });

    // Ads by package
    const { data: pkgAds } = await supabase.from('ads').select('packages(name)').eq('status', 'published');
    const byPackage = {};
    pkgAds.forEach(a => {
      const name = a.packages?.name || 'Unknown';
      byPackage[name] = (byPackage[name] || 0) + 1;
    });

    // System health
    const { data: healthLogs } = await supabase
      .from('system_health_logs')
      .select('*')
      .order('checked_at', { ascending: false })
      .limit(5);

    res.json({
      success: true,
      data: {
        listings:    { total, active, pending, expired, rejected },
        revenue:     { total: totalRevenue, pending: pendingPayments, monthly: monthlyRevenue },
        moderation:  { approved, rejected: rejectedMod, approvalRate, rejectionRate: 100 - approvalRate },
        taxonomy:    { byCategory, byCity, byPackage },
        systemHealth: healthLogs,
      },
    });
  } catch (err) { next(err); }
});

export default router;
