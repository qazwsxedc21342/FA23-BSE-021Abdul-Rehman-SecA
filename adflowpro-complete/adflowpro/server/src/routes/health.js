import { Router } from 'express';
import supabase from '../db/supabase.js';
import { isDemoMode } from '../utils/runtime.js';

const router = Router();

router.get('/db', async (req, res, next) => {
  const start = Date.now();
  try {
    if (isDemoMode()) {
      const ms = Date.now() - start;
      return res.json({
        success: true,
        data: {
          status: 'unconfigured',
          response_ms: ms,
          checked_at: new Date().toISOString(),
        },
      });
    }

    const { error } = await supabase.from('system_health_logs').select('id').limit(1);
    const ms     = Date.now() - start;
    const status = error ? 'error' : 'ok';

    await supabase.from('system_health_logs').insert({
      source: 'api_health_check', response_ms: ms, status,
      message: error ? error.message : 'Database reachable',
    });

    res.json({ success: true, data: { status, response_ms: ms, checked_at: new Date().toISOString() } });
  } catch (err) { next(err); }
});

export default router;
