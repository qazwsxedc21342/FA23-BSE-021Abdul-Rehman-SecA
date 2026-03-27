import { Router } from 'express';
import supabase from '../db/supabase.js';
import { isDemoMode } from '../utils/runtime.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    if (isDemoMode()) {
      return res.json({
        success: true,
        data: [
          { id: 'demo-cat-vehicles', name: 'Vehicles', slug: 'vehicles', is_active: true },
          { id: 'demo-cat-electronics', name: 'Electronics', slug: 'electronics', is_active: true },
          { id: 'demo-cat-real-estate', name: 'Real Estate', slug: 'real-estate', is_active: true },
        ],
      });
    }

    const { data, error } = await supabase.from('categories').select('*').eq('is_active', true).order('name');
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

export default router;
