import { Router } from 'express';
import supabase from '../db/supabase.js';
import { isDemoMode } from '../utils/runtime.js';

const router = Router();

// GET /api/ads - Browse active ads with search, filter, sort, pagination
router.get('/', async (req, res, next) => {
  try {
    const { search, category, city, sort = 'rank', page = 1, limit = 12 } = req.query;

    if (isDemoMode()) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 1,
        },
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('ads')
      .select(`
        id, title, slug, description, price, status, rank_score, is_featured, publish_at, expire_at, created_at,
        categories(id, name, slug),
        cities(id, name, slug),
        packages(id, name, weight, is_featured),
        users(id, name),
        seller_profiles(display_name, is_verified),
        ad_media(source_type, original_url, thumbnail_url, validation_status)
      `, { count: 'exact' })
      .eq('status', 'published')
      .gt('expire_at', new Date().toISOString());

    if (search)   query = query.ilike('title', `%${search}%`);
    if (category) query = query.eq('categories.slug', category);
    if (city)     query = query.eq('cities.slug', city);

    if (sort === 'rank')    query = query.order('rank_score', { ascending: false });
    if (sort === 'newest')  query = query.order('publish_at', { ascending: false });
    if (sort === 'oldest')  query = query.order('publish_at', { ascending: true });

    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({
      success: true,
      data,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count, pages: Math.ceil(count / limit) },
    });
  } catch (err) { next(err); }
});

// GET /api/ads/:slug - Single ad detail
router.get('/:slug', async (req, res, next) => {
  try {
    if (isDemoMode()) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }

    const { data, error } = await supabase
      .from('ads')
      .select(`
        id, title, slug, description, price, status, rank_score, is_featured, publish_at, expire_at, created_at,
        categories(id, name, slug),
        cities(id, name, slug),
        packages(id, name, duration_days, weight, is_featured),
        users(id, name),
        seller_profiles(display_name, business_name, is_verified, city),
        ad_media(source_type, original_url, thumbnail_url, validation_status)
      `)
      .eq('slug', req.params.slug)
      .eq('status', 'published')
      .single();

    if (error || !data) return res.status(404).json({ success: false, message: 'Ad not found' });

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

export default router;
