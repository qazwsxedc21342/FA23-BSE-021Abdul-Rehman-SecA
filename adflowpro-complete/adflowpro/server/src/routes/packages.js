import { Router } from 'express';
import supabase from '../db/supabase.js';
import { isDemoMode } from '../utils/runtime.js';

const router = Router();

// GET /api/packages
router.get('/', async (req, res, next) => {
  try {
    if (isDemoMode()) {
      return res.json({
        success: true,
        data: [
          {
            id: 'demo-basic',
            name: 'Basic',
            duration_days: 7,
            weight: 1,
            is_featured: false,
            price: 999,
            is_active: true,
            description: '7-day listing with standard placement.',
          },
          {
            id: 'demo-standard',
            name: 'Standard',
            duration_days: 15,
            weight: 2,
            is_featured: false,
            price: 2499,
            is_active: true,
            description: '15-day listing with category priority.',
          },
          {
            id: 'demo-premium',
            name: 'Premium',
            duration_days: 30,
            weight: 3,
            is_featured: true,
            price: 4999,
            is_active: true,
            description: '30-day featured listing with homepage boost.',
          },
        ],
      });
    }

    const { data, error } = await supabase.from('packages').select('*').eq('is_active', true).order('price');
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

export default router;
