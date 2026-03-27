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
          { id: 'demo-city-karachi', name: 'Karachi', slug: 'karachi', is_active: true },
          { id: 'demo-city-lahore', name: 'Lahore', slug: 'lahore', is_active: true },
          { id: 'demo-city-islamabad', name: 'Islamabad', slug: 'islamabad', is_active: true },
        ],
      });
    }

    const { data, error } = await supabase.from('cities').select('*').eq('is_active', true).order('name');
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

export default router;
